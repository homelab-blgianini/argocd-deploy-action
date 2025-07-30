const core = require('@actions/core');
const axios = require('axios');
const https = require('https');

async function run() {
  try {
    // Inputs
    const nomeAplicacao = core.getInput('nome-aplicacao', { required: true });
    const namespace = core.getInput('namespace') || 'default';

    // Constantes
    const argocdServer = 'https://humix.blgianini.com:30443';
    const argocdUsername = 'admin';
    const argocdPassword = 'NC3m8MoIaZ7li8ln';

    const repoUrl = 'https://github.com/homelab-blgianini/example-app.git';
    const path = '.';
    const targetRevision = 'HEAD';

    core.info(`Iniciando processo para aplicação: ${nomeAplicacao}`);
    core.info(`Servidor ArgoCD: ${argocdServer}`);

    const token = await authenticateArgoCD(argocdServer, argocdUsername, argocdPassword);
    const exists = await checkApplicationExists(argocdServer, token, nomeAplicacao);

    let applicationCreated = false;

    if (exists) {
      core.info(`✅ Aplicação '${nomeAplicacao}' já existe no ArgoCD`);
    } else {
      core.info(`ℹ️ Aplicação '${nomeAplicacao}' não existe. Criando...`);
      await createApplication(argocdServer, token, {
        name: nomeAplicacao,
        namespace,
        repoUrl,
        path,
        targetRevision
      });
      applicationCreated = true;
      core.info(`✅ Aplicação '${nomeAplicacao}' criada com sucesso!`);
    }

    core.setOutput('application-created', applicationCreated.toString());
    core.setOutput('application-name', nomeAplicacao);

  } catch (error) {
    core.setFailed(`❌ Erro na action: ${error.message}`);
  }
}

async function authenticateArgoCD(server, username, password) {
  core.info('🔐 Autenticando no ArgoCD...');
  const url = `${server}/api/v1/session`;

  try {
    const response = await axios.post(url, { username, password }, {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    const token = response.data.token;
    core.info(`✅ Token recebido: ${token.substring(0, 10)}...`);
    return token;
  } catch (error) {
    if (error.response) {
      core.error(`❌ Status: ${error.response.status}`);
      core.error(`❌ Resposta: ${JSON.stringify(error.response.data)}`);
      throw new Error(`Erro na autenticação: ${error.response.status} - ${error.response.data.message || 'Sem mensagem'}`);
    }
    throw new Error(`Erro na autenticação: ${error.message}`);
  }
}

async function checkApplicationExists(server, token, applicationName) {
  const url = `${server}/api/v1/applications/${applicationName}`;
  core.info(`🔎 Verificando existência da aplicação: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    return response.status === 200;
  } catch (error) {
    if (error.response?.status === 404) {
      core.info('🔄 Aplicação não encontrada (404). Será criada.');
      return false;
    }

    if (error.response?.status === 403) {
      core.info('🔄 Aplicação não encontrada (403). Será criada.');
      return false;
    }

    if (error.response?.status === 403) {
      core.error(`🚫 Permissão negada ao acessar aplicação '${applicationName}'`);
      core.error(`Resposta: ${JSON.stringify(error.response.data)}`);
    }

    throw new Error(`Erro ao verificar aplicação: ${error.message}`);
  }
}

async function createApplication(server, token, config) {
  const url = `${server}/api/v1/applications`;

  const payload = {
    metadata: {
      name: config.name,
      namespace: 'argocd' // Namespace do ArgoCD, não da aplicação
    },
    spec: {
      project: 'default',
      source: {
        repoURL: config.repoUrl,
        targetRevision: config.targetRevision,
        path: config.path
      },
      destination: {
        server: 'https://kubernetes.default.svc',
        namespace: config.namespace
      },
      syncPolicy: {
        automated: {
          prune: true,
          selfHeal: true
        },
        syncOptions: ['CreateNamespace=true']
      }
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    if ([200, 201].includes(response.status)) {
      return response.data;
    }

    throw new Error(`Status inesperado: ${response.status}`);
  } catch (error) {
    if (error.response) {
      core.error(`❌ Falha ao criar aplicação`);
      core.error(`Status: ${error.response.status}`);
      core.error(`Resposta: ${JSON.stringify(error.response.data)}`);
      throw new Error(`Erro ao criar aplicação: ${error.response.data.message || error.message}`);
    }

    throw new Error(`Erro ao criar aplicação: ${error.message}`);
  }
}

run();