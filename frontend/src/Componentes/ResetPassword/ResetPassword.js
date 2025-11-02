import React, {useState, useEffect} from "react";
import '../../App.scss'
import {Link, useLocation} from 'react-router-dom'
import Input from '../UI/Input';

import video from '../../Assets/economia.mp4';
import logo from '../../Assets/logo.png';
import fundo from '../../Assets/fundo.jpg'
import { BsFillShieldLockFill } from "react-icons/bs";
import { CiLogin } from "react-icons/ci";

const ResetPassword = () => {

    const [showBg, setShowBg] = useState(false);
      
          useEffect(() => {
              setTimeout(() => setShowBg(true), 200); // pequeno delay para o efeito
          }, []);
    
    const location =useLocation();
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    const[senha, setSenha] = useState("")
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const[mensagem, setMensagem] = useState("")

    function senhaForte(senha){
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(senha);
  }

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem("");

    if(!senha || !confirmarSenha){
      setMensagem("Preencha todos os campos");
      return;
    }


    if(!senhaForte(senha)){
      setMensagem("A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.");
      return;
    }

    if(senha !== confirmarSenha){
      setMensagem("As senhas não coincidem.");
      return;
    }

    try{
        const response = await fetch(`${process.env.REACT_APP_API_URL}/redefinir-senha`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                token,
                nova_senha: senha,
                confirmar_senha: confirmarSenha
            }),
        });
        const data = await response.json();
        if(response.ok){
            setMensagem(data.mensagem || "Senha alterada com sucesso!");
        }else{
            setMensagem(typeof data.detail === 'string' 
                    ? data.detail
                    : Array.isArray(data.detail)
                        ? data.detail.map(e => e.msg).join(' | ')
                        : 'Ocorreu um erro ao enviar a senha.');
        }
    } catch(error){
        setMensagem("Erro de conexão com o servidor");
    }
    
  };


    return(
        <>
        <div className={`login-bg${showBg ? ' show' : ''}`} style={{ backgroundImage: `url(${fundo})`}}></div>
        <div className='loginPage flex'>
            <div className="container flex">
                <div className="videoDiv">
                    <video src={video} autoPlay loop muted></video>
                    <div className="textDiv">
                        <h2 className="title">Perdeu sua senha ?</h2>
                        <p>Refaça sua senha com alguns cliques</p>
                    </div>

                    <div className="footerDiv flex">
                        <span className="text">Já mudou sua senha ?</span>
                        <Link to={'/'}>
                        <button className="btn">Login</button>
                        </Link>
                    </div>
                </div>

                <div className="formDiv flex">
                    <div className="headerDiv">
                        <img src={logo} alt="Logo Imagem"/>
                        <h3>Refaça sua nova senha</h3>    
                    </div>

                    <form className='form grid' onSubmit={handleSubmit}>
                        {mensagem && <span className='showMessage'>{mensagem}</span>}

                    <Input
                        type="password"
                        placeholder="Nova Senha"
                        id='password'
                        name='password'
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                        icon={BsFillShieldLockFill}
                    />

                    <Input
                        type="password"
                        placeholder="Repita a Nova Senha"
                        id='confirm-password'
                        name='confirm-password'
                        value={confirmarSenha}
                        onChange={e => setConfirmarSenha(e.target.value)}
                        icon={BsFillShieldLockFill}
                    />

                    <button type ='submit' className="btn flex">
                        <span>Alterar Senha</span>
                        <CiLogin className="icon"/>
                    </button>
                    </form>   
                </div>

            </div>
        </div>
        </>
    )
}

export default ResetPassword;
