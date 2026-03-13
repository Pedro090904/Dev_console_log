import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

export default function Home() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    socket.on('dadosRadar', (dados) => setApps(dados));
    return () => { socket.off('dadosRadar'); };
  }, []);

  return (
    <div style={{ backgroundColor: '#0B0F19', minHeight: '100vh', padding: '40px', color: '#F8FAFC', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* Cabeçalho Moderno */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '24px', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            <span style={{ color: '#3B82F6' }}>Nexus</span> Monitor
          </h1>
          <p style={{ color: '#64748B', margin: '8px 0 0 0', fontSize: '14px' }}>Painel de Controle de Infraestrutura • IP: Localhost</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0F172A', padding: '8px 16px', borderRadius: '20px', border: '1px solid #1E293B' }}>
          <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: apps.length > 0 ? '#10B981' : '#F59E0B', boxShadow: apps.length > 0 ? '0 0 8px #10B981' : 'none' }}></span>
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>
            {apps.length > 0 ? 'Agente Conectado' : 'Aguardando Agente...'}
          </span>
        </div>
      </header>

      {/* Grid de Aplicações */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
        {apps.map((app) => (
          <div 
            key={app.id}
            onClick={() => navigate(`/app/${app.id}`)}
            style={{ 
              backgroundColor: '#111827', 
              border: '1px solid #1F2937', 
              borderRadius: '12px', 
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => { 
              e.currentTarget.style.transform = 'translateY(-4px)'; 
              e.currentTarget.style.borderColor = '#3B82F6';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.1)';
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.borderColor = '#1F2937';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Linha superior do Card */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#F1F5F9' }}>{app.nome}</h3>
                <span style={{ color: '#64748B', fontSize: '12px', fontFamily: 'monospace' }}>PID: {app.pid}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: app.status === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '12px', border: `1px solid ${app.status === 'online' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: app.status === 'online' ? '#10B981' : '#EF4444' }}></span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: app.status === 'online' ? '#10B981' : '#EF4444', textTransform: 'uppercase' }}>{app.status}</span>
              </div>
            </div>
            
            {/* Grid de Métricas Internas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ color: '#64748B', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Processador</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#E2E8F0', fontFamily: 'monospace' }}>{app.cpu}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Memória</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#E2E8F0', fontFamily: 'monospace' }}>{app.ram}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Uptime</div>
                <div style={{ fontSize: '14px', color: '#94A3B8' }}>{app.uptime}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Restarts</div>
                <div style={{ fontSize: '14px', color: app.restarts > 0 ? '#F59E0B' : '#94A3B8' }}>{app.restarts}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}