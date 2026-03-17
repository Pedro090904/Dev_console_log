const pm2 = require('pm2');
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, { cors: { origin: '*' } });

server.listen(8093, () => {
  console.log('📡 [DevAtlas Agent] Torre de transmissão ligada na porta 4000!');
});

io.on('connection', (socket) => {
  console.log(`[🟢 Espectador Conectado] ID: ${socket.id}`);

  socket.on('pm2Acao', ({ appName, acao }) => {
    console.log(`[Comando Recebido] ${acao} na aplicação ${appName}`);
    if (acao === 'start') {
      pm2.start(appName, (err) => { if (err) console.error(`Erro ao iniciar ${appName}:`, err); });
    } else if (acao === 'restart') {
      pm2.restart(appName, (err) => { if (err) console.error(`Erro ao reiniciar ${appName}:`, err); });
    } else if (acao === 'stop') {
      pm2.stop(appName, (err) => { if (err) console.error(`Erro ao parar ${appName}:`, err); });
    } else if (acao === 'delete') {
      pm2.delete(appName, (err) => { if (err) console.error(`Erro ao deletar ${appName}:`, err); });
    }
  });
});

pm2.connect((err) => {
  if (err) process.exit(2);

  
  const calcularUptime = (timestamp) => {
    if (!timestamp) return '0s';
    const diff = Date.now() - timestamp;
    const segundos = Math.floor((diff / 1000) % 60);
    const minutos = Math.floor((diff / 1000 / 60) % 60);
    const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (dias > 0) return `${dias}d ${horas}h`;
    if (horas > 0) return `${horas}h ${minutos}m`;
    if (minutos > 0) return `${minutos}m ${segundos}s`;
    return `${segundos}s`;
  };

  // O BATIMENTO CARDÍACO (Agora com dados avançados)
  setInterval(() => {
    pm2.list((err, list) => {
      if (err) return;
      
      const radarData = list.map((app) => ({
        id: app.name,
        nome: app.name.toUpperCase(),
        status: app.pm2_env.status,
        cpu: app.monit ? Math.round(app.monit.cpu) + '%' : '0%',
        ram: app.monit ? Math.round(app.monit.memory / 1024 / 1024) + ' MB' : '0 MB',
        uptime: calcularUptime(app.pm2_env.pm_uptime),
        restarts: app.pm2_env.restart_time || 0,
        pid: app.pid,
        modo: app.pm2_env.exec_mode
      }));

      io.emit('dadosRadar', radarData);
    });
  }, 3000);

 // O CÉREBRO: Escutando Logs e Eventos
  pm2.launchBus((err, bus) => {
    if (err) return console.error('Erro no Bus:', err);

    console.log('🎧 Escutando barramento de logs do PM2...');

    bus.on('log:out', (pacote) => {
      // Ignora os próprios logs
      if (pacote.process.name === 'nexus-agent') return;

      console.log(`[ESPIÃO] Log enviado para o Front: "${pacote.process.name}"`);

      // ENVIANDO O NOME EXATO (Sem cortes)
      io.emit('novoLog', { 
        app: pacote.process.name, 
        tipo: 'info', 
        texto: pacote.data 
      });
    });

    bus.on('log:err', (pacote) => {
      if (pacote.process.name === 'nexus-agent') return;

      // ENVIANDO O NOME EXATO (Sem cortes)
      io.emit('novoLog', { 
        app: pacote.process.name, 
        tipo: 'erro', 
        texto: pacote.data 
      });
    });
  });
});