const core = require('@actions/core');
const axios = require('axios');

async function run() {
  try {
    // Obter inputs da action
    const nomeAplicacao = core.getInput('nome-aplicacao');
    const argocdServer = "https://humix.blgianini.com:30443";
    const argocdUsername = "admin";
    const argocdPassword = "NC3m8MoIaZ7li8ln";
    const namespace = core.getInput('namespace') || 'default';
    core.info(`Iniciando processo para aplicação: ${nomeAplicacao}`);
    core.info(`Servidor ArgoCD: ${argocdServer}`);

    // Autenticar no ArgoCD
    const authToken = await authenticateArgoCD(argocdServer, argocdUsername, argocdPassword);
    
    // Verificar se a aplicação já existe
    const applicationExists = await checkApplicationExists(argocdServer, authToken, nomeAplicacao);
    
    let applicationCreated = false;
    
    if (applicationExists) {
      core.info(`Aplicação '${nomeAplicacao}' já existe no ArgoCD`);
    } else {
      core.info(`Aplicação '${nomeAplicacao}' não existe. Criando...`);
      await createApplication(argocdServer, authToken, {
        name: nomeAplicacao,
        namespace: namespace,
        repoUrl: repoUrl,
        path: path,
        targetRevision: targetRevision
      });
      applicationCreated = true;
      core.info(`Aplicação '${nomeAplicacao}' criada com sucesso!`);
    }

    // Definir outputs
    core.setOutput('application-created', applicationCreated.toString());
    core.setOutput('application-name', nomeAplicacao);

  } catch (error) {
    core.setFailed(`Erro na action: ${error.message}`);
  }
}

async function authenticateArgoCD(server, username, password) {
  try {
    core.info('Autenticando no ArgoCD...');
    
    const authUrl = `${server}/api/v1/session`;
    const authData = {
      username: username,
      password: password
    };

    const response = await axios.post(authUrl, authData, {
      headers: {
        'Content-Type': 'application/json'
      },
      // Ignorar certificados SSL auto-assinados em desenvolvimento
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });

    const token = response.data.token;
    core.info('Autenticação realizada com sucesso');
    
    return token;
  } catch (error) {
    if (error.response) {
      throw new Error(`Erro na autenticação: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
    }
    throw new Error(`Erro na autenticação: ${error.message}`);
  }
}

async function checkApplicationExists(server, token, applicationName) {
  try {
    core.info(`Verificando se aplicação '${applicationName}' existe...`);
    
    const appUrl = `${server}/api/v1/applications/${applicationName}`;
    
    const response = await axios.get(appUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });

    return response.status === 200;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    throw new Error(`Erro ao verificar aplicação: ${error.message}`);
  }
}

async function createApplication(server, token, appConfig) {
  try {
    core.info(`Criando aplicação '${appConfig.name}'...`);
    
    const createUrl = `${server}/api/v1/applications`;
    
    const applicationSpec = {
      metadata: {
        name: appConfig.name,
        namespace: 'argocd' // Namespace do ArgoCD, não da aplicação
      },
      spec: {
        project: 'default',
        source: {
          repoURL: appConfig.repoUrl,
          targetRevision: appConfig.targetRevision,
          path: appConfig.path
        },
        destination: {
          server: 'https://kubernetes.default.svc',
          namespace: appConfig.namespace
        },
        syncPolicy: {
          automated: {
            prune: true,
            selfHeal: true
          },
          syncOptions: [
            'CreateNamespace=true'
          ]
        }
      }
    };

    const response = await axios.post(createUrl, applicationSpec, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });

    if (response.status === 200 || response.status === 201) {
      core.info(`Aplicação '${appConfig.name}' criada com sucesso`);
      return response.data;
    } else {
      throw new Error(`Resposta inesperada: ${response.status}`);
    }
  } catch (error) {
    if (error.response) {
      throw new Error(`Erro ao criar aplicação: ${error.response.status} - ${error.response.data.message || JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Erro ao criar aplicação: ${error.message}`);
  }
}

// Executar a action
run();
