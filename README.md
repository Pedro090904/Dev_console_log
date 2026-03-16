# 📡 Nexus Monitor - Documentação Oficial

O **Nexus Monitor** é um SaaS de monitorização de infraestrutura em tempo real. Ele conecta-se diretamente à memória do PM2 para extrair métricas de saúde (CPU, RAM, Uptime) e intercetar logs de múltiplas aplicações simultaneamente, exibindo tudo num painel web interativo e guardando o histórico localmente.

---

## 🛠️ PARTE 1: O Guia Definitivo do PM2

O PM2 é um Gestor de Processos para Node.js. A sua função é manter as aplicações vivas para sempre (reiniciando-as se falharem) e gerir os recursos da máquina.

### 1. Como instalar o PM2

Para que o seu computador reconheça o comando `pm2` em qualquer pasta, instale-o globalmente:

```bash
npm install -g pm2

```

### 2. Como colocar uma aplicação a rodar no PM2

O PM2 é "cego" em relação à tecnologia. Ele só precisa de um ficheiro de entrada para arrancar.

**Opção A: Rodar um Back-end (Ex: NestJS, Express, Node puro)**

1. Compile o seu projeto (se usar TypeScript): `npm run build`
2. Inicie o ficheiro compilado dando um nome amigável ao processo:

```bash
pm2 start dist/main.js --name "minha-api-backend"

```

**Opção B: Rodar um Front-end (Ex: React com Vite em Produção)**
Front-ends modernos geram ficheiros estáticos (HTML/CSS/JS). Para os rodar no PM2, usamos a função estática embutida do PM2 (`serve`):

1. Crie a versão de produção do seu Front-end: `npm run build`
2. Peça ao PM2 para servir a pasta `dist` (onde ficam os ficheiros finais) numa porta específica (ex: 8080) como uma Single Page Application (`--spa`):

```bash
pm2 serve dist 8080 --name "meu-front-react" --spa

```

### 3. Comandos Úteis do PM2 no Dia a Dia

* `pm2 list` -> Mostra a tabela com todas as aplicações a rodar, o Status, a CPU e a RAM.
* `pm2 logs [nome-da-app]` -> Mostra o terminal da aplicação.
* `pm2 stop [nome-da-app]` -> Pausa a aplicação temporariamente.
* `pm2 restart [nome-da-app]` -> Reinicia a aplicação (útil após atualizar o código).
* `pm2 delete [nome-da-app]` -> Remove a aplicação do gestor do PM2.

---

## 🧠 PARTE 2: Como o Nexus funciona por debaixo dos panos?

O Nexus Monitor possui uma arquitetura dividida em duas peças que comunicam via túnel de rede (WebSockets):

**1. O Agente (Back-end: `agent.js`)**

* **O que faz:** Ele não lê ficheiros `.log` no disco rígido. Em vez disso, usa `pm2.connect()` para entrar na RAM do sistema operacional.
* **Métricas (Batimento Cardíaco):** A cada 3 segundos, ele executa `pm2.list`, limpa os dados inúteis, e emite um pacote com CPU, RAM e Uptime (`dadosRadar`) para o Front-end.
* **Logs (Event Bus):** Usa o `pm2.launchBus()` para colocar uma "escuta" no sistema. Sempre que qualquer aplicação no PM2 faz um `console.log`, o Agente interceta a string e atira-a (`novoLog`) pela porta 4000.

**2. O Painel (Front-end: React / Vite)**

* **O que faz:** É a interface de utilizador. Conecta-se à porta 4000 via `socket.io-client`.
* **Motor de Dados (IndexedDB):** Usa a biblioteca `localforage` para criar um banco de dados interno no navegador do utilizador. Sempre que um log chega na tela, ele é salvo silenciosamente. Isto resolve o problema de limite de armazenamento (`localStorage`) e permite guardar gigabytes de logs históricos separados por sessões sem consumir o servidor.

---

## 🚀 PARTE 3: Como Iniciar e Rodar o Nexus

Para ver a mágica acontecer, é necessário rodar as duas peças do Nexus em terminais separados.

### Passo 1: Ligar o Agente Transmissor

Abra o terminal na pasta raiz do projeto (onde está o ficheiro `agent.js`) e rode:

```bash
node agent.js

```

*(Dica de mestre: Você pode usar o próprio PM2 para rodar o seu Agente rodando `pm2 start agent.js --name "nexus-agent"`)*.

### Passo 2: Ligar o Painel React

Abra um **segundo terminal**, navegue até à pasta do Front-end e inicie o servidor de desenvolvimento do Vite:

```bash
cd front
npm install   # (Apenas na primeira vez)
npm run dev

```

O terminal irá gerar um link (ex: `http://localhost:5173`). Abra-o no seu navegador.

---

## 💻 PARTE 4: Como Operar a Ferramenta

1. **A Página Radar (Home):**
* Exibe todos os processos que estão vivos no PM2 do servidor conectado.
* Os dados de CPU e RAM são reais e atualizados a cada 3 segundos.
* Se a bolinha superior direita estiver verde ("Agente Conectado"), a ponte de WebSockets está a funcionar.


2. **O Raio-X (App Detail):**
* Ao clicar num cartão, você entra nos detalhes específicos daquela aplicação.
* **Terminal Ao Vivo:** Exibe os logs a acontecerem em tempo real. Possui um botão "Limpar Tela" que limpa a interface visual e fecha o bloco de registo atual no banco de dados.
* **Análise de Histórico:** Mostra todas as sessões guardadas no navegador do seu computador. Clique numa "pasta" para abrir o visualizador isolado daquela sessão, sem afetar o recebimento dos logs ao vivo. Use o botão vermelho "Excluir Tudo" para limpar o banco de dados do seu navegador.

