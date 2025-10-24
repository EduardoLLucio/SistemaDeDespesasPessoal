import React, {useState, useEffect} from 'react'
import '../../App.scss'
import { Link } from 'react-router-dom'
import Input from '../UI/Input';

import video from '../../Assets/economia.mp4'
import logo from '../../Assets/logo.png'
import fundo from '../../Assets/fundo.jpg'
import { FaUserShield } from "react-icons/fa6";
import { BsFillShieldLockFill } from "react-icons/bs";
import { CiLogin } from "react-icons/ci";




const Login = () => {
  //estados para os campos do formulario

  const[email, setEmail] = useState("")
  const[senha, setSenha] = useState("")
  const[mensagem, setMensagem] = useState("")

  const [showBg, setShowBg] = useState(false);

  useEffect(()=> {
    setTimeout(() => setShowBg(true), 200); // pequeno delay para o efeito
  }, [])


  function validarEmail(email){
    return /\S+@\S+\.\S+/.test(email);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem("");

    if(!email || !senha){
      setMensagem("Preencha todos os campos");
      return;
    }

    if(!validarEmail(email)){
      setMensagem("Digite um email válido.");
      return;
    }

  try{
    const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, password: senha})
    });
  
    if (response.ok){
      const data = await response.json();
      
      localStorage.setItem('token', data.access_token);      
      setEmail('');
      setSenha('');
      setMensagem('Login realizado com sucesso!');
      window.location.href = '/dashboard';

    }else{
      const data= await response.json();
      setMensagem(data.detail || 'Erro no login. Tente novamente.');
    }
  } catch (error){
    setMensagem('Erro ao conectar ao servidor. Tente novamente mais tarde.');
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
                <h2 className='title'>Cadastre suas despesas e receitas</h2>
                <p>Organize suas finanças de forma simples e prática</p>
            </div>
            
            <div className="footerDiv flex">
              <span className="text">Não tem uma conta ?</span>
              <Link to={'/register'}>
                <button className='btn'>Cadastre-se</button>
              </Link>
          </div>
        </div> 

          <div className="formDiv flex">
            <div className="headerDiv">
              <img src={logo} alt="Logo Imagem" />
              <h3>Bem vindo</h3>
            </div>

            <form action="" className='form grid' onSubmit={handleSubmit}>
              {mensagem && <span className='showMessage'>{mensagem}</span>}

              
              <Input
                type="text"
                placeholder="Email"
                id="email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={FaUserShield}
              />

              <Input
                type="password"
                placeholder="Password"
                id="password"
                name="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                icon={BsFillShieldLockFill}
              />

              <button type='submit' className="btn flex">
                <span>Entrar</span>
                <CiLogin className='icon' />
              </button>

              <span className='forgotPassword'>
                Esqueceu sua senha? <Link to="/forgot-password">Clique aqui</Link>
              </span>

            </form>
          </div>
      </div>
    </div>
  </>
  );
};

export default Login
