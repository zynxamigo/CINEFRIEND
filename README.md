# CINEFRIEND

Assista junto, mesmo de longe. Aplicação web mobile-first para salas privadas, playlists M3U/M3U8 locais e reprodução sincronizada.

## Executar
Requer Node.js 20+.

```sh
npm install
npm start
```
Abra http://localhost:3000.

## Recursos
- Salas privadas com código de 6 caracteres.
- Anfitrião controla conteúdo, play/pause e posição.
- Chat, participantes e pedidos em tempo real.
- Playlist processada localmente no navegador, busca, categorias e favoritos.

## Limitações
Reproduz apenas links HTTP(S) acessíveis diretamente pelo navegador. Formatos, codecs e CORS variam; HLS não funciona nativamente em todos os navegadores. Não inclui proxy/transcodificação, metadados externos nem bypass de DRM. Cada participante carrega o stream no próprio dispositivo. Salas e mensagens ficam em memória e somem quando o servidor reinicia. Importe apenas conteúdo autorizado e não compartilhe URLs com tokens privados. O código da sala é a credencial de acesso.

## Deploy
Use hospedagem Node.js com WebSockets, configure PORT e use HTTPS.
## Páginas e autenticação

- Início: `frontend/index.html`
- Sobre: `frontend/about.html`
- Source: `frontend/source.html`
- Login/cadastro: `frontend/login.html`

### Ativar login com Supabase

1. Crie um projeto em https://supabase.com/ (o Supabase é baseado em software open source).
2. No painel do projeto, copie a Project URL e a chave pública/anon.
3. Edite `frontend/auth-config.js` e substitua os valores de exemplo.
4. Em Authentication, configure os provedores e URLs permitidas para o domínio do GitHub Pages.
5. Antes de armazenar dados privados, configure políticas Row Level Security (RLS) e valide as permissões no servidor.

A página de login é apenas uma interface até que o Supabase seja configurado. O login no navegador, sozinho, **não protege páginas estáticas, o código-fonte público ou os eventos do servidor**. Para proteger salas e dados, o servidor Node.js deve validar a sessão/token e autorizar cada ação. Nunca exponha a chave `service_role`, credenciais de banco ou segredos em arquivos frontend.

### Publicar o servidor de salas

O GitHub Pages serve apenas o frontend. Para habilitar salas compartilhadas:

1. Crie um serviço web Node.js no Render a partir deste repositório: https://render.com/
2. Configure **Root Directory** como vazio (raiz do repositório), **Build Command** `npm install` e **Start Command** `npm start`.
3. Depois que o Render gerar a URL HTTPS do serviço, abra `frontend/server-config.js` e defina `window.CINEFRIEND_SERVER_URL` com essa URL (sem barra final), por exemplo `https://seu-servico.onrender.com`.
4. Faça commit da alteração. O GitHub Pages atualizará o frontend.
5. No Render, defina a variável de ambiente `CLIENT_URL` para `https://zynxamigo.github.io` e publique novamente.

O plano gratuito do provedor pode suspender o serviço após inatividade; a primeira conexão pode demorar. Salas ficam em memória e desaparecem quando o servidor reinicia. Este procedimento ativa o servidor de salas, mas não substitui autenticação e autorização para recursos privados.
