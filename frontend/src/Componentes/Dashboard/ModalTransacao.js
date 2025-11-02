import React, {useState} from "react";
import { FaSpotify, FaCreditCard, FaMoneyBill, FaShoppingCart, FaUtensils, FaFilm, FaUserTie, FaRegFileAlt } from 'react-icons/fa';
import { MdConstruction, MdEmojiTransportation, MdCastForEducation } from 'react-icons/md';
import './ModalTransacao.scss';

export const transacaoCategorias = [
    { nome: 'Salario', icone: <FaMoneyBill />},
    { nome: 'Streaming', icone: <FaSpotify />},
    { nome: 'Cartão de Crédito', icone: <FaCreditCard />},
    { nome: 'Compras', icone: <FaShoppingCart />},
    { nome: 'Alimentação', icone: <FaUtensils />},
    { nome: 'Entretenimento', icone: <FaFilm />},
    { nome: 'Transporte', icone: <MdEmojiTransportation />},
    { nome: 'Educação', icone: <MdCastForEducation  />},
    { nome: 'Construção', icone: <MdConstruction  />},
    { nome: 'Forncedores', icone: <FaUserTie  />},
    { nome: 'Boletos', icone: <FaRegFileAlt  />},

];



export default function Modaltransacao({open, onClose, onTransacaoAdicionada}){
    const [categoriaselecionada, setCategoriaselecionada] = useState(transacaoCategorias[0].nome);
    const [valor, setValor] = useState('');
    const [data, setData] = useState('');
    const [tipo, setTipo] = useState('receita');
    const [descricao, setDescricao] = useState('');


    if(!open) return null;

    const categoriaAtual = transacaoCategorias.find(c => c.nome === categoriaselecionada);

    const handleSubmit = async (e) => {
        e.preventDefault();

       

        const token = localStorage.getItem('token');
        const body = {
            transacao: categoriaselecionada,
            categoria: categoriaselecionada,
            valor: Number(valor),
            data,
            tipo,
            descricao
        };

        await fetch(`${process.env.REACT_APP_API_URL}/lancamentos/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)

        });

        setCategoriaselecionada(transacaoCategorias[0].nome);
        setValor('');
        setData('');
        setTipo('receita');
        setDescricao('');
        

        if(typeof onTransacaoAdicionada === 'function'){onTransacaoAdicionada();}
        onClose();
        };



    return(
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Adicionar Transação</h2>
                <form onSubmit={handleSubmit}>
                    
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>

                        <select value={categoriaselecionada} onChange={e => setCategoriaselecionada(e.target.value)}>
                            {transacaoCategorias.map(c=> (<option key={c.nome} value={c.nome}>{c.icone} {c.nome}</option>))}
                        </select>
                        
                        <span>{categoriaAtual.icone}</span>
                    </div>
                    
                    <input type="number" placeholder="valor" value={valor} onChange={e => setValor(e.target.value)}/>



                    <input type="datetime-local" placeholder="Data" value={data} onChange={e => setData(e.target.value)}/>

                    
                    <select value={tipo} onChange={e => setTipo(e.target.value)}>
                           <option value='receita'>Receita</option>
                           <option value='despesa'>Despesa</option>
                        </select>

                    <input type="text" placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)}/>

                    <div className="modal-actions">
                        <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit">Salvar</button>
                    </div>                    
                </form>
            </div>
        </div>
    );
}