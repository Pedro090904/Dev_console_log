import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import localforage from 'localforage';

const socket = io('http://localhost:4000');

const limparCoresTerminal = (texto: string) => {
  if (!texto) return '';
  return texto.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
};

const MetricCard = ({ label, value, color = '#E2E8F0' }: { label: string, value: string | number, color?: string }) => (
  <div style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '10px', border: '1px solid #1E293B', minWidth: '120px' }}>
    <div style={{ color: '#64748B', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '18px', fontWeight: '600', color, fontFamily: label === 'Modo' ? 'sans-serif' : 'monospace' }}>{value}</div>
  </div>
);

export default function AppDetail() {
  const { appName } = useParams();
  const navigate = useNavigate();

  const [abaAtiva, setAbaAtiva] = useState<'aovivo' | 'historico'>('aovivo');
  const [logsAoVivo, setLogsAoVivo] = useState<any[]>([]);
  const [historicoSessoes, setHistoricoSessoes] = useState<any[]>([]);
  const [sessaoVisualizada, setSessaoVisualizada] = useState<any | null>(null);
  
  // NOVO: Estado para controlar a exibição do Modal de exclusão
  const [mostrarModalExclusao, setMostrarModalExclusao] = useState(false);
  
  const [metricas, setMetricas] = useState({ cpu: '0%', ram: '0 MB', status: '...', uptime: '0s', restarts: 0, pid: 0, modo: '-' });

  const idSessaoAtual = useRef(`Sessão de ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`);
  const fimDoTerminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const carregarHistorico = async () => {
      const dadosSalvos: any = await localforage.getItem(`nexus_logs_${appName}`);
      if (dadosSalvos) setHistoricoSessoes(dadosSalvos);
    };
    carregarHistorico();

    const escutarLogs = (pacote: any) => {
      if (pacote.app === appName) {
        setLogsAoVivo((logs) => {
          const novos = [...logs, pacote];
          salvarNoIndexedDB(novos);
          return novos;
        });
      }
    };

    const escutarMetricas = (listaDeApps: any[]) => {
      const appAtual = listaDeApps.find((app) => app.id === appName);
      if (appAtual) setMetricas(appAtual);
    };

    socket.on('novoLog', escutarLogs);
    socket.on('dadosRadar', escutarMetricas);

    return () => {
      socket.off('novoLog', escutarLogs);
      socket.off('dadosRadar', escutarMetricas);
    };
  }, [appName]);

  useEffect(() => {
    if (abaAtiva === 'aovivo') {
      fimDoTerminalRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logsAoVivo, abaAtiva]);

  const salvarNoIndexedDB = async (logsDestaSessao: any[]) => {
    const historicoAtual: any[] = (await localforage.getItem(`nexus_logs_${appName}`)) || [];
    const index = historicoAtual.findIndex((s) => s.id === idSessaoAtual.current);
    
    if (index >= 0) historicoAtual[index].logs = logsDestaSessao;
    else historicoAtual.unshift({ id: idSessaoAtual.current, logs: logsDestaSessao });
    
    await localforage.setItem(`nexus_logs_${appName}`, historicoAtual);
    setHistoricoSessoes(historicoAtual);
  };

  // --- NOVAS FUNÇÕES CRUD ---

  // 1. Limpar Terminal Ao Vivo
  const limparTerminal = () => {
    setLogsAoVivo([]); // Limpa a tela
    // Gera uma nova "gaveta" para que os próximos logs não se misturem com a sessão antiga no banco de dados
    idSessaoAtual.current = `Sessão de ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} (Após Limpeza)`;
  };

  // 2. Deletar Histórico Completo
  const confirmarExclusao = async () => {
    await localforage.removeItem(`nexus_logs_${appName}`); // Remove do banco de dados
    setHistoricoSessoes([]); // Limpa a lista na tela
    setSessaoVisualizada(null); // Fecha o visualizador se estiver aberto
    setMostrarModalExclusao(false); // Fecha o modal
  };

  return (
    <div style={{ backgroundColor: '#0B0F19', minHeight: '100vh', padding: '32px 40px', color: '#F8FAFC', fontFamily: "'Inter', -apple-system, sans-serif", position: 'relative' }}>
      
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (Sobrepõe toda a tela) */}
      {mostrarModalExclusao && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#111827', padding: '32px', borderRadius: '16px', border: '1px solid #334155', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#F8FAFC' }}>Excluir Histórico?</h3>
            <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              Tem a certeza de que deseja apagar permanentemente todas as sessões guardadas para <strong>{appName}</strong>? Esta ação não pode ser desfeita e os dados serão perdidos.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setMostrarModalExclusao(false)} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#E2E8F0', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', flex: 1 }}>
                Cancelar
              </button>
              <button onClick={confirmarExclusao} style={{ padding: '10px 20px', backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', flex: 1, boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}>
                Sim, Excluir Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER E MÉTRICAS */}
      <button onClick={() => navigate('/')} style={{ backgroundColor: 'transparent', color: '#64748B', border: 'none', cursor: 'pointer', padding: '0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', transition: 'color 0.2s' }}>
        ← Voltar para o Radar
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#F8FAFC' }}>{appName?.toUpperCase()}</h2>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
        <MetricCard label="Status" value={metricas.status.toUpperCase()} color={metricas.status === 'online' ? '#10B981' : '#EF4444'} />
        <MetricCard label="CPU" value={metricas.cpu} color="#3B82F6" />
        <MetricCard label="RAM" value={metricas.ram} color="#8B5CF6" />
        <MetricCard label="Uptime" value={metricas.uptime} />
        <MetricCard label="Restarts" value={metricas.restarts} color={metricas.restarts > 0 ? '#F59E0B' : '#E2E8F0'} />
        <MetricCard label="PID" value={metricas.pid} />
        <MetricCard label="Exec Mode" value={metricas.modo} />
      </div>

      {/* NAVEGAÇÃO DAS ABAS */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #1E293B', marginBottom: '24px' }}>
        <button onClick={() => { setAbaAtiva('aovivo'); setSessaoVisualizada(null); }} style={{ padding: '0 0 12px 0', cursor: 'pointer', border: 'none', backgroundColor: 'transparent', fontSize: '15px', fontWeight: '500', color: abaAtiva === 'aovivo' ? '#3B82F6' : '#64748B', borderBottom: abaAtiva === 'aovivo' ? '2px solid #3B82F6' : '2px solid transparent' }}>
          Terminal Ao Vivo
        </button>
        <button onClick={() => setAbaAtiva('historico')} style={{ padding: '0 0 12px 0', cursor: 'pointer', border: 'none', backgroundColor: 'transparent', fontSize: '15px', fontWeight: '500', color: abaAtiva === 'historico' ? '#3B82F6' : '#64748B', borderBottom: abaAtiva === 'historico' ? '2px solid #3B82F6' : '2px solid transparent' }}>
          Análise de Histórico
        </button>
      </div>

      {/* ABA: TERMINAL AO VIVO */}
      {abaAtiva === 'aovivo' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 380px)', minHeight: '400px' }}>
          {/* BARRA DE FERRAMENTAS DO TERMINAL */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button onClick={limparTerminal} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#1E293B', color: '#94A3B8', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.color = '#F8FAFC'; e.currentTarget.style.backgroundColor = '#334155'; }} onMouseOut={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.backgroundColor = '#1E293B'; }}>
              <span style={{ fontSize: '14px' }}>🧹</span> Limpar Tela
            </button>
          </div>
          
          <div style={{ backgroundColor: '#050505', padding: '24px', borderRadius: '12px', flexGrow: 1, overflowY: 'auto', fontFamily: "'Fira Code', 'Cascadia Code', monospace", fontSize: '13px', border: '1px solid #1E293B', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
            {logsAoVivo.length === 0 ? <p style={{ color: '#475569', fontStyle: 'italic' }}>Aguardando fluxo de logs...</p> : null}
            {logsAoVivo.map((log, index) => (
              <div key={index} style={{ marginBottom: '6px', lineHeight: '1.6' }}>
                <span style={{ color: '#475569', marginRight: '16px', userSelect: 'none' }}>{new Date().toLocaleTimeString()}</span>
                <span style={{ color: log.tipo === 'erro' ? '#EF4444' : '#10B981', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{limparCoresTerminal(log.texto)}</span>
              </div>
            ))}
            <div ref={fimDoTerminalRef} />
          </div>
        </div>
      )}

      {/* ABA: HISTÓRICO */}
      {abaAtiva === 'historico' && (
        <div style={{ height: 'calc(100vh - 380px)', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          
          {!sessaoVisualizada ? (
            <>
              {/* BARRA DE FERRAMENTAS DO HISTÓRICO */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#94A3B8', margin: 0, fontSize: '14px', fontWeight: '500' }}>Sessões Guardadas no Navegador</h3>
                {historicoSessoes.length > 0 && (
                  <button onClick={() => setMostrarModalExclusao(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <span style={{ fontSize: '14px' }}>🗑️</span> Excluir Tudo
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px', overflowY: 'auto', flexGrow: 1, paddingBottom: '20px' }}>
                {historicoSessoes.length === 0 ? <div style={{ color: '#64748B', backgroundColor: '#111827', padding: '32px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #334155' }}>Nenhum histórico armazenado ainda.</div> : null}
                {historicoSessoes.map((sessao, i) => (
                  <div key={i} onClick={() => setSessaoVisualizada(sessao)} style={{ backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '10px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#3B82F6'} onMouseOut={e => e.currentTarget.style.borderColor = '#1E293B'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '20px' }}>📁</span>
                      <h4 style={{ margin: 0, color: '#F1F5F9', fontSize: '15px' }}>{sessao.id}</h4>
                    </div>
                    <div style={{ color: '#64748B', fontSize: '13px' }}>
                      <strong>{sessao.logs.length}</strong> eventos registados nesta sessão. <br/>
                      <span style={{ color: '#3B82F6', marginTop: '8px', display: 'inline-block' }}>Abrir visualizador de logs →</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: '12px 24px', borderRadius: '12px 12px 0 0', border: '1px solid #1E293B', borderBottom: 'none' }}>
                <span style={{ color: '#F1F5F9', fontWeight: '500', fontSize: '14px' }}>Visualizando: {sessaoVisualizada.id}</span>
                <button onClick={() => setSessaoVisualizada(null)} style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                  ✕ Fechar Visualizador
                </button>
              </div>
              <div style={{ backgroundColor: '#050505', padding: '24px', borderRadius: '0 0 12px 12px', flexGrow: 1, overflowY: 'auto', fontFamily: "'Fira Code', 'Cascadia Code', monospace", fontSize: '13px', border: '1px solid #1E293B' }}>
                {sessaoVisualizada.logs.map((log: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '6px', lineHeight: '1.6' }}>
                    <span style={{ color: log.tipo === 'erro' ? '#EF4444' : '#94A3B8', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{limparCoresTerminal(log.texto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}