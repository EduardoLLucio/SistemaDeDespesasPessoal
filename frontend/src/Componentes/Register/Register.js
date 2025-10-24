import React, { useState, useEffect } from 'react'
import './Register.scss'
import '../../App.scss'
import { Link } from 'react-router-dom'

import video from '../../Assets/economia.mp4'
import logo from '../../Assets/logo.png'
import fundo from '../../Assets/fundo.jpg'
import { FaUserShield } from "react-icons/fa6";
import { BsFillShieldLockFill } from "react-icons/bs";
import { CiLogin } from "react-icons/ci";
import Input from '../UI/Input'



const Register = () => {
  //estados pasra os campos do formulario
  const [showBg, setShowBg] = useState(false);
  
      useEffect(() => {
          setTimeout(() => setShowBg(true), 200); // pequeno delay para o efeito
      }, []);

  const[nome, setNome]= useState("")
  const[sobrenome, setSobrenome]= useState("")
  const[telefone, setTelefone]= useState("")
  const[email, setEmail] = useState("")
  const[senha, setSenha] = useState("")
  const[confirmarSenha, setConfirmarSenha] = useState("")
  const[mensagem, setMensagem] = useState("")


  function validarNome(nome) {
  // Aceita apenas letras (maiúsculas/minúsculas), espaços e acentos
  return /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(nome); 
  }

  function validarEmail(email){
    return /\S+@\S+\.\S+/.test(email);
  }

  function validarTelefone(telefone){
    const tel = telefone.replace(/\D/g, "");
    return /^(\d{2})(\d{8,9})$/.test(tel);
  }

  function senhaForte(senha){
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(senha);
  }

  

  const handleSubmit = async(e) => {
    e.preventDefault();
    setMensagem("");

    if(!nome || !sobrenome || !telefone || !email || !senha || !confirmarSenha){
      setMensagem("Preencha todos os campos");
      return;
    }

    if (!validarNome(nome) || !validarNome(sobrenome)) {
      setMensagem("Nome e sobrenome devem conter apenas letras.");
      return;
    }

    if(!validarEmail(email)){
      setMensagem("Digite um email válido.");
      return;
    }

    if(!validarTelefone(telefone)){
      setMensagem("Digite um telefone válido.");
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
    const response = await fetch(`${process.env.REACT_APP_API_URL}/cadastro`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({first_name: nome, last_name: sobrenome, cellphone: telefone, email, password: senha, confirm_password: confirmarSenha})
  });

  if (response.ok) {
    setMensagem('Cadastro realizado com sucesso! Verifique seu email para ativar a conta')

    setNome('');
    setSobrenome('');
    setTelefone('');
    setEmail('');
    setSenha('');
    setConfirmarSenha('');
    }else {
      const data = await response.json();
      setMensagem(data.detail || 'Erro ao cadastrar.')
    }
  } catch (error){
    setMensagem('Erro de conexão com o servidor')
  }
};


  return (
    <>
    <div className={`login-bg${showBg ? ' show' : ''}`} style={{ backgroundImage: `url(${fundo})`}}></div>
    <div className='loginPage flex'>
      <div className="container flex">
           <div className="videoDiv">
              <video src={video} autoPlay loop muted></video>
              <div className="textDiv">
                <h2 className='title'>Faça sua conta e comece a gerenciar suas finanças</h2>
                <p>Rapido e pratico</p>
            </div>
            
            <div className="footerDiv flex">
              <span className="text">Já tem uma conta ?</span>
              <Link to="/">
                <button className='btn'>Login</button>
              </Link>
          </div>
        </div> 

    
          <div className="formDiv flex">
            <div className="headerDiv">
              <h3>Cadastre-se</h3>
            </div>
            <form className='form grid' onSubmit={handleSubmit}>
              {mensagem && <span className='showMessage'>{mensagem}</span>}
            
              <Input
                type="text"
                placeholder="Nome"
                id="first_name"
                name="first_name"
                value={nome}
                onChange={e => setNome(e.target.value)}
                icon={FaUserShield}
              />

              <Input
              type="text"
              placeholder="Sobrenome"
              id="last_name"
              name="last_name"
              value={sobrenome}
              onChange={e => setSobrenome(e.target.value)}
              icon={FaUserShield}
              />

              <Input
                type="text"
                placeholder="Telefone"
                id="phone"
                name="phone"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                icon={FaUserShield}
              />

              <Input
                type="email"
                placeholder="Email"
                id="email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={FaUserShield}
              />

              <Input
                type="password"
                placeholder="Senha"
                id="password"
                name="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                icon={BsFillShieldLockFill}
              />

              <Input
              type="password"
              placeholder="Confirme a Senha"
              id="confirm_password"
              name="confirm_password"
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              icon={BsFillShieldLockFill}
            />

              <button type='submit' className="btn flex">
                <span>Entrar</span>
                <CiLogin className='icon' />
              </button>

            </form>
          </div>
      </div>
    </div>
    </>
  )
}

export default Register
