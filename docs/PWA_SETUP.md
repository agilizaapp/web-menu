# PWA Configuration - Web Menu

## 📱 PWA Instalável (Sem Cache Offline)

Este projeto está configurado como uma **Progressive Web App (PWA) instalável**, permitindo que os usuários adicionem o app à tela inicial do dispositivo.

### ✨ Características

- ✅ **Instalável**: Pode ser adicionado à tela inicial (iOS/Android/Desktop)
- ✅ **Modo Standalone**: Abre em tela cheia, sem barra de endereço
- ❌ **SEM Cache Offline**: Sempre requer conexão com internet
- ❌ **SEM Funcionalidade Offline**: Não funciona sem internet

### 📋 Arquivos da Configuração

```
public/
├── manifest.json          # Configurações do PWA (nome, ícones, cores)
├── sw.js                  # Service Worker mínimo (apenas para instalação)
├── icon-192x192.png       # Ícone 192x192 (substituir por ícone real)
└── icon-512x512.png       # Ícone 512x512 (substituir por ícone real)
```

### 🎨 Personalizações Necessárias

#### 1. Substituir Ícones
Os ícones atuais são placeholders. Substitua por ícones reais:

```bash
# Crie ícones PNG nos tamanhos:
- 192x192 pixels → public/icon-192x192.png
- 512x512 pixels → public/icon-512x512.png
```

**Dica**: Use ferramentas como [Favicon Generator](https://realfavicongenerator.net/) ou [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)

#### 2. Personalizar Manifest (`public/manifest.json`)

```json
{
  "name": "Nome Completo do App",
  "short_name": "Nome Curto",
  "theme_color": "#sua-cor-tema",
  "background_color": "#sua-cor-fundo"
}
```

### 🚀 Como Instalar o App

#### Android (Chrome/Edge)
1. Abra o site no navegador
2. Toque no menu (⋮) → "Adicionar à tela inicial"
3. Confirme a instalação

#### iOS (Safari)
1. Abra o site no Safari
2. Toque no ícone de compartilhar (□↑)
3. Role e toque em "Adicionar à Tela de Início"
4. Confirme

#### Desktop (Chrome/Edge)
1. Abra o site
2. Clique no ícone de instalação (⊕) na barra de endereço
3. Ou vá em Menu → "Instalar Web Menu"

### 🔧 Como Funciona

#### Service Worker (Network-Only)
```javascript
// Estratégia: Network Only
// Sempre busca da rede, sem cache
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
```

**Por que Network-Only?**
- ✅ Sempre mostra conteúdo atualizado
- ✅ Não ocupa espaço em disco com cache
- ✅ Mais simples de manter e debugar
- ❌ Não funciona offline (comportamento desejado)

### 🧪 Testar em Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
pnpm dev

# Acesse via HTTPS (necessário para PWA)
# Opção 1: Use ngrok
npx ngrok http 3000

# Opção 2: Use localhost.run
ssh -R 80:localhost:3000 localhost.run
```

**⚠️ Importante**: PWAs só funcionam em HTTPS (exceto localhost)

### 📊 Validar Configuração PWA

#### Chrome DevTools
1. Abra DevTools (F12)
2. Vá em "Application" → "Manifest"
3. Vá em "Application" → "Service Workers"
4. Use Lighthouse → "Progressive Web App"

#### Online
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### 🔍 Troubleshooting

#### O app não aparece para instalação?
- ✅ Verifique se está usando HTTPS
- ✅ Verifique o console para erros no Service Worker
- ✅ Teste em DevTools → Application → Manifest
- ✅ Aguarde alguns segundos após carregar a página

#### Service Worker não registra?
```javascript
// Verifique no console do navegador
navigator.serviceWorker.getRegistrations()
  .then(registrations => console.log(registrations));
```

#### Limpar Service Worker (desenvolvimento)
```javascript
// Execute no console do navegador
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
```

### 🎯 Diferenças: PWA com vs sem Cache

| Recurso | Com Cache Offline | Sem Cache (Este Projeto) |
|---------|------------------|--------------------------|
| Instalável | ✅ Sim | ✅ Sim |
| Modo Standalone | ✅ Sim | ✅ Sim |
| Funciona Offline | ✅ Sim | ❌ Não |
| Cache de Assets | ✅ Sim | ❌ Não | 
| Tamanho em Disco | 📦 Maior | 📦 Mínimo |
| Complexidade | 🔧 Maior | 🔧 Mínima |

### 📚 Recursos

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Web App Manifest Spec](https://w3c.github.io/manifest/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### 🔄 Próximos Passos (Opcional)

Se no futuro quiser adicionar cache offline:

1. **Cache Estático** (HTML, CSS, JS)
2. **Cache de API** (com estratégias cache-first ou network-first)
3. **Página Offline** (fallback quando sem internet)
4. **Background Sync** (sincronizar quando voltar online)

---

**Versão**: 1.0.0  
**Última atualização**: Outubro 2025
