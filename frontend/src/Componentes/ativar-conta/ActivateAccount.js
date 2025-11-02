import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function ActivateAccount() {
  const { search } = useLocation();
  const token = new URLSearchParams(search).get('token');
  const [msg, setMsg] = useState('Ativando sua conta...');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    async function run() {
      if (!token) { setMsg('Token ausente.'); return; }
      try {
        const url = `${process.env.REACT_APP_API_URL}/ativar-conta?token=${encodeURIComponent(token)}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (res.ok) { setOk(true); setMsg(data.mensagem || 'Conta ativada com sucesso!'); }
        else { setMsg(data.detail || 'Token inválido ou expirado.'); }
      } catch {
        setMsg('Erro ao contatar o servidor.');
      }
    }
    run();
  }, [token]);

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
      <div style={{maxWidth:480,textAlign:'center'}}>
        <h2>{ok ? 'Tudo certo!' : 'Ativação de conta'}</h2>
        <p>{msg}</p>
        <Link to="/" className="btn">Ir para o login</Link>
      </div>
    </div>
  );
}