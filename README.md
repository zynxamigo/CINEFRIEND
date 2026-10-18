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