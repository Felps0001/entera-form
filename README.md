# Formulário Entera

Formulário responsivo em React, API Node/Express e armazenamento MongoDB. Logo original copiado de `entera-pdfs/public/logo-verde.png`.

## Rodar localmente

O projeto usa npm workspaces, com dependências declaradas por aplicação:

- `backend/`: API Node/Express e configuração privada do MongoDB.
- `frontend/`: interface React/Vite, logo e estilos.
- `shared/`: validação e texto do aceite usados pelas duas aplicações.

Mantenha as três pastas no checkout. A instalação é feita na raiz; os processos de frontend e backend podem rodar separadamente.

Requer Node 22.14+ e uma instância MongoDB local ou Atlas.

```powershell
npm install
Copy-Item backend/.env.example backend/.env
# Se backend/.env já existir, preserve-o. Edite MONGODB_URI nele.
npm run dev
```

Abra http://localhost:5173. O Vite encaminha `/api` para a API na porta 3001. Se alterar a porta da API, ajuste também `frontend/vite.config.js`.

Para executar em terminais separados, use `npm run dev:backend` e `npm run dev:frontend` na raiz. Também é possível entrar em `backend` ou `frontend` e executar `npm run dev` em cada pasta. O arquivo `.env` original foi movido para `backend/.env` preservando os valores.

O padrão de desenvolvimento é `mongodb://127.0.0.1:27017/entera_form`. O nome do banco é definido na própria URI. Para Atlas, use o formato `mongodb+srv://USUARIO:SENHA@CLUSTER/entera_form?retryWrites=true&w=majority` e permita o acesso de rede do servidor. Nunca coloque a URI em variáveis `VITE_*` ou no frontend. `.env` não é versionado.

## Produção

```powershell
npm run build
npm start
```

`npm start` inicia somente a API, na porta 3001 por padrão. Hospede `frontend/dist` em um serviço estático separado. Antes do build, configure `VITE_API_URL` em `frontend/.env` com a origem pública da API (sem `/api` no final). No backend, configure `FRONTEND_ORIGIN` com a origem exata do frontend para permitir CORS. Alternativamente, use um proxy no mesmo domínio que encaminhe `/api` à API e deixe `VITE_API_URL` vazio.

Configure as variáveis de ambiente no serviço de hospedagem e HTTPS no proxy. Se houver proxy reverso, ajuste `TRUST_PROXY` ao número real de proxies confiáveis (padrão: 0). A limitação de requisições é em memória por instância. Para conferir o build localmente, use `npm run preview --workspace frontend`; com uma API em outra origem, configure `VITE_API_URL` antes do build e ajuste `FRONTEND_ORIGIN` à origem do preview.

## Dados e aceite

`POST /api/registrations` recebe `fullName`, `crm`, `state` (UF do CRM), `phone` (DDD + número), `email` e `consent` (booleano `true`). Todos são obrigatórios e validados no frontend e na API. A validação de CRM verifica somente o formato numérico; não consulta conselhos profissionais.

A coleção `registrations` guarda os campos normalizados, `createdAt`, `consentAcceptedAt`, `consentVersion` e `consentText`. O texto básico do aceite está em `shared/registration.js`; ajuste a redação à finalidade real de uso antes de publicar e incremente sua versão ao alterá-la. Não há endpoint público de consulta dos cadastros. Envios repetidos são armazenados como novos registros.

Sem MongoDB disponível, a tela abre normalmente, mas o envio retorna erro e mantém os campos preenchidos. Uma confirmação de sucesso só aparece após a gravação.

## Verificação

```powershell
npm test
npm run build
```

Os testes verificam validação, normalização, rejeição sem aceite, persistência via interface simulada e falha de banco. A integração com uma instância MongoDB real depende da configuração do ambiente.
