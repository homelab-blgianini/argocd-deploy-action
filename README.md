# ArgoCD Deploy Action

Esta GitHub Action cria uma aplicação no ArgoCD caso ela não exista.

## Inputs

### `nome-aplicacao`
**Obrigatório** Nome da aplicação que será criada no ArgoCD.

### `argocd-server`
**Obrigatório** URL do servidor ArgoCD (ex: https://argocd.example.com).

### `argocd-username`
**Obrigatório** Username para autenticação no ArgoCD. Padrão: `admin`.

### `argocd-password`
**Obrigatório** Password para autenticação no ArgoCD.

### `namespace`
**Opcional** Namespace onde a aplicação será implantada. Padrão: `default`.

### `repo-url`
**Obrigatório** URL do repositório Git da aplicação.

### `path`
**Opcional** Caminho no repositório onde estão os manifestos. Padrão: `.`.

### `target-revision`
**Opcional** Branch, tag ou commit específico. Padrão: `HEAD`.

## Outputs

### `application-created`
Retorna `true` se a aplicação foi criada, `false` se já existia.

### `application-name`
Nome da aplicação processada.

## Exemplo de uso

```yaml
uses: homelab-blgianini/argocd-deploy-action@v1
with:
  nome-aplicacao: 'minha-aplicacao'
  argocd-server: 'https://argocd.example.com'
  argocd-username: 'admin'
  argocd-password: 'NC3m8MoIaZ7li8ln'
  namespace: 'production'
  repo-url: 'https://github.com/user/repo.git'
  path: 'k8s/'
  target-revision: 'main'
```

## Desenvolvimento

Para fazer build da action:

```bash
npm run build
```

Isto irá compilar o código para `dist/index.js` usando o ncc.