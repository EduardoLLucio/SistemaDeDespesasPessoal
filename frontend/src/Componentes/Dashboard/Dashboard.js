import React from 'react'
import './Dashboard.scss'
import {FiPlus, FiCalendar, FiFilter, FiTrash2} from 'react-icons/fi'
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {transacaoCategorias} from './ModalTransacao';
import Modaltransacao from './ModalTransacao';
import ModalFoto from './ModalFoto';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend} from 'recharts';
import { MdNoEncryption } from 'react-icons/md';


              /*Mini graficos na lateral*/

const MiniGrafico = ({ title, children }) => (
  <div className="mini-grafico">
    <div className="titulo-mini-grafico">{title}</div>

    
  <div className="mini-grafico-area">
      {children || <span className = "placeholder-text">Seu Gráfico aqui</span>}
  </div>
  
</div>
);



function getIcon(nome){
  const categoria = transacaoCategorias.find(c => c.nome === nome);
  return categoria ? categoria.icone : null;
}




const ItemTransacao = ({id, icon, transacao, valor, data, tipo, descricao, onDelete }) => (
  <div className="transaction-row">
    <span className="cell">{getIcon(transacao)} {transacao}</span>
    <span className={`cell amount ${tipo === 'receita' ? 'renda' : 'gastos'}`}>
      {tipo === 'despesa' ? `R$ -${Number(valor).toLocaleString('pt-br', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : Number(valor).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
    </span>
    <span className="cell">{data ? new Date(data).toLocaleString('pt-BR', { day:  '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}).replace(':00', '') : ''}</span>
    <span className="cell">{tipo}</span>
    <span className="cell">{descricao}</span>
    <span className='cell'>
      <button className='btn-trash' title='Excluir' onClick={() => onDelete(id)}>
        <FiTrash2/>
      </button>
    </span>
  </div>
);


export default function Dashboard() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const navigate = useNavigate();
  function handleLogout(){
    localStorage.clear();
    navigate('/');
  }

  const [modalFotoOpen, setModalFotoOpen] = React.useState(false);
  const [fotoPreview, setFotoPreview] = React.useState(null);
  const [fotoFile, setFotoFile] = React.useState(null);
  const [fotoUrl, setFotoUrl] = React.useState(null);

  const [dataFiltro, setDataFiltro] = React.useState("");
  const [textoFiltro, setTextoFiltro] = React.useState("");




  function calcularPatrimonio(transacoes){
    if (!Array.isArray(transacoes)) return 0;
    return transacoes.reduce((total, t) => {
      if(t.tipo === 'receita'){
        return total + Number(t.valor);
      }else{
        return total - Number(t.valor);
      }
    }, 0);
  }
 

  function buscarTransacoes() {
    const token = localStorage.getItem('token');
   
    fetch(`${process.env.REACT_APP_API_URL}/lancamentos/`, {
      headers: {
        'Authorization': `Bearer ${token}`
        
      }
    })
      .then(res => res.json())
      .then(data => {
          console.log('Transacoes recebidas:', data);
        setTransacao(data);
      });

  }
  

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token){
      navigate('/');
    }
  }, [navigate]);

  const [transacoes, setTransacao] = React.useState([]);

  useEffect(() =>{
    const token = localStorage.getItem('token');
    if(!token){
      navigate('/')
      return
    }
    fetch(`${process.env.REACT_APP_API_URL}/lancamentos/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setTransacao(data))
  }, [navigate])

  const handleOpenModalFoto = () => {
    setFotoPreview(fotoUrl ? `${process.env.REACT_APP_API_URL}${fotoUrl}` : null);
    setModalFotoOpen(true);
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/usuario/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setFotoUrl(data.foto_perfil);
      });
  }, [modalFotoOpen])

  const atualizarFotoUrl = () => {
  const token = localStorage.getItem('token');
  fetch(`${process.env.REACT_APP_API_URL}/usuario/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      setFotoUrl(data.foto_perfil);
    });
};

function excluirTransacao(id) {
  const token = localStorage.getItem('token');
  fetch(`${process.env.REACT_APP_API_URL}/lancamento/${id}`,{
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => {
    if(res.ok){
      buscarTransacoes();
    }
  });
}

function filtrarPorData(){
  if(!dataFiltro) return buscarTransacoes();
  const token = localStorage.getItem('token');
  fetch(`${process.env.REACT_APP_API_URL}/lancamentos/?data=${dataFiltro}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => setTransacao(data));
}

function filtrarPorTexto(){
  if(!textoFiltro) return buscarTransacoes();
  const token = localStorage.getItem('token');
  fetch(`${process.env.REACT_APP_API_URL}/lancamentos/?texto=${textoFiltro}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => setTransacao(data));
}

useEffect(()=> {
  if(dataFiltro){
    filtrarPorData();
  }else if (textoFiltro){
    filtrarPorTexto();
  }else{
    buscarTransacoes();
  }
 
}, [dataFiltro, textoFiltro]);

const dadosRenda = gerarDadosDiarios(transacoes, 'receita');
const dadosGastos = gerarDadosDiarios(transacoes, 'despesa');


function gerarDadosDiarios(transacoes, tipo){
  if (!Array.isArray(transacoes) || transacoes.length === 0) return[];

  const filtradas = transacoes.filter(t => t.tipo === tipo && t.data);

  const datas = filtradas.map(t => t.data.slice(0,10)).sort();

  if(datas.length === 0) return [];
  const inicio = new Date(datas[0]);
  const fim = new Date(datas[datas.length -1]);

  const dados = [];
  let atual = new Date(inicio);

  while(atual <= fim){
    const diaStr = atual.toISOString().slice(0,10);
    const valor = filtradas
      .filter(t => t.data.slice(0,10) === diaStr)
      .reduce((soma, t) => soma + Number(t.valor), 0);
    dados.push({dia: diaStr, valor});
    atual.setDate(atual.getDate() + 1);
  }

  return dados;

}


function MiniGraficoLinha({dados, cor}){
  return(
    <ResponsiveContainer width='100%' height={80}>
      <LineChart data={dados}>
        <XAxis dataKey="dia" />
        <Tooltip />
        <Line type='monotone' dataKey='valor' stroke={cor} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}


function gerarPatrimonio(transacoes){
  let saldo = 0;
  const dados =[];
  const ordenadas = [...transacoes].sort((a,b) => new Date(a.data) - new Date(b.data));
  ordenadas.forEach(t => {saldo += t.tipo === 'receita' ? Number(t.valor) : -Number(t.valor);
  dados.push({data: t.data.slice(0,10), saldo});
  });
  return dados;
}

const dadosPatrimonio = gerarPatrimonio(transacoes);

function gerarBarrasMensais(transacoes, tipo){
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return meses.map((nome, i) => {
    const mes = (i+1).toString().padStart(2, '0');
    const valor = transacoes
      .filter(t => t.tipo === tipo && t.data && t.data.slice(5,7)==mes)
      .reduce((soma, t) => soma + Number(t.valor), 0);
    return {mes: nome, valor };
  });
}

const dadosBarras = gerarBarrasMensais(transacoes, 'despesa');

function gerarReceitasMensais(transacoes){
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return meses.map((nome, i) => {
    const mes = (i+1).toString().padStart(2, '0');
    const valor = transacoes
      .filter(t => t.tipo === 'receita' && t.data && t.data.slice(5,7) === mes)
      .reduce((soma, t) => soma+ Number(t.valor), 0);
    return {mes: nome, valor};
  });
}

function gerarLucroMensal(transacao){
  const receitas = gerarReceitasMensais(transacao);
  const despesas = gerarBarrasMensais(transacao, 'despesa');
  return receitas.map((r, i) => ({
    mes: r.mes,
    lucro: r.valor - despesas[i].valor,
    receita: r.valor,
    despesa: despesas[i].valor
  }));
}

const dadosLucroMensal = gerarLucroMensal(transacoes);


  return(
  
    <div className='dashboard-root'>
      <aside className='sidebar'>
        <div className='logo'>E</div>
        <nav className='side-nav'>
          <button className='nav-item'>➤</button>
          <button className='nav-item'>▣</button>
          <button className='nav-item'>⦿</button>
          <button className='nav-item'>⚙</button>
        </nav>

        <div className='avatar'>      
          <img src={fotoUrl ? `http://localhost:8000${fotoUrl}` : require('../../Assets/user.png')} alt='user' onClick={handleOpenModalFoto} style={{cursor: 'pointer'}} />
          <button className='logout-btn' onClick={handleLogout} title='Sair'>⦿</button>
        </div>
      </aside>

      {/*conteúdo principal da tela*/}
      <Modaltransacao open={modalOpen} onClose={() => setModalOpen(false)} onTransacaoAdicionada={buscarTransacoes} />

      <ModalFoto modalFotoOpen={modalFotoOpen}
      setModalFotoOpen={setModalFotoOpen}
      fotoPreview={fotoPreview}
      setFotoPreview={setFotoPreview}
      fotoFile={fotoFile}
      setFotoFile={setFotoFile}
      atualizarFotoUrl={atualizarFotoUrl}
      />

      <main className='content'>
        <header className='header'>
          <h1>Dashboard</h1>

          <div className='header-actions'>
            <button className='btn primary' onClick={() => setModalOpen(true)}><FiPlus/>Adicionar Transaçoes</button>
          </div>
        </header>

        <section className='overview-section'>
          <div className='card networth-card'>
            <div className='net-header'>
              <div className='net-value'>{calcularPatrimonio(transacoes).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</div>
              <div className='net-sub'>Patrimônio Líquido</div>
            </div>

            {/*Grafico grande*/}
          <div className='big-chart'>
            <ResponsiveContainer width='100%' height={220}>
              <LineChart data={dadosLucroMensal}>
                <XAxis dataKey="mes" />
                <Tooltip />
                <Legend/>
                <Line type='monotone' dataKey='despesa' stroke='#ff1900ff' strokeWidth={2} dot={false} name='Despesas' />
                <Line type='monotone' dataKey='lucro' stroke='#00ff6aff' strokeWidth={2} dot={false} name='Lucro' />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className='big-chart'>
            <ResponsiveContainer width='100%' height={220}>
              <BarChart data={dadosLucroMensal}>
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend/>
                <Bar dataKey='despesa' fill='#ff0000ff' name='Despesas' radius={[6, 6, 0, 0]} />
                <Bar dataKey='lucro' fill='#00ff08ff' name='Lucro' radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
              

            <div className='side-cards'>
              <div className='card small-card'>
                <MiniGrafico title="Renda"> <MiniGraficoLinha dados={dadosRenda} cor="#4caf50"/></MiniGrafico>
              </div>

              <div className='card small-card'>
                <MiniGrafico title="Gastos"> <MiniGraficoLinha dados={dadosGastos} cor="#ff0000ff"/></MiniGrafico>
              </div>
            </div>
            </div>
        </section>

        
          <section className='transactions card'>
            <h2>Histórico de Transações</h2>

            <div className='table-controls'>
              <div/>
              <div className='filters'>
                <input type='date' 
                value={dataFiltro} 
                onChange={e => setDataFiltro(e.target.value)} 
                className='input-date'/>

                <input type='text'
                placeholder='Filtrar por descrição ou categoria'
                value={textoFiltro} 
                onChange={e => setTextoFiltro(e.target.value)} 
                className='input-filter'/>

                

              </div>
            </div>

            <div className='it-list'>
              <div className='transaction-row header'>
                <span className='cell'>Transação</span>
                <span className='cell'>Quantia</span>
                <span className='cell'>Data</span>
                <span className='cell'>Tipo</span>
                <span className='cell'>Descricao</span>
                <span className='cell'>Ação</span>
              </div>
              {Array.isArray(transacoes) && transacoes.map((t, i)=> (
                <ItemTransacao key={t.id} {...t} onDelete={excluirTransacao}/>
              ))}
            </div>
          </section>
       </main>
    </div>
   );
}



