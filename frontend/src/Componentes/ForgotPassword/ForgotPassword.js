import React, { useState, useEffect} from 'react'
import './ForgotPassword.scss'
import '../../App.scss'
import { Link } from 'react-router-dom'
import Input from '../UI/Input';

import video from '../../Assets/economia.mp4'
import logo from '../../Assets/logo.png'
import fundo from '../../Assets/fundo.jpg'
import { MdEmail } from "react-icons/md";
import { CiLogin } from 'react-icons/ci';

const ForgotPassword = () => { 
    const [showBg, setShowBg] = useState(false);

    useEffect(() => {
        setTimeout(() => setShowBg(true), 200); // pequeno delay para o efeito
    }, []);


    const [email, setEmail] = useState("")
    const [mensagem, setMensagem] = useState("")

    function validarEmail(email) {
        return /\S+@\S+\.\S+/.test(email);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensagem("");

        if (!email) {
            setMensagem("Preencha todos os campos");
            return;
        }

        if (!validarEmail(email)) {
            setMensagem("Digite um email válido.");
            return;
        }

    

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/esqueci-senha`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email})
            });
            const data = await response.json();
            if (response.ok) {
                setMensagem(data.mensagem || "Se o email existir, um link será enviado para redefinir a senha.");
            } else {
                setMensagem(typeof data.detail === 'String' 
                    ? data.detail
                    : Array.isArray(data.detail)
                        ? data.detail.map(e => e.msg).join(' | ')
                        : 'Ocorreu um erro ao enviar o email.');
            }
        } catch (error) {
            setMensagem("Erro de conexão com o servidor.");
        }
    };

    return (
        <>
        <div className={`login-bg${showBg ? ' show' : ''}`} style={{ backgroundImage: `url(${fundo})`}}></div>
        <div className='loginPage flex'>
            <div className='container flex'>
                <div className='videoDiv'>
                    <video src={video} autoPlay muted loop></video>
                    <div className='textDiv'>
                        <h2 className='title'>Recupere sua senha</h2>
                        <p>Insira seu email cadastrado para receber as instruções de recuperação de senha</p>
                    </div>

                <div className="footerDiv flex">
                    <span className="text">Lembrou da senha?</span>
                    <Link to={'/'}>
                        <button className='btn'>Login</button>
                    </Link>
                </div>
            </div>

            <div className='formDiv flex'>
                <div className='headerDiv'>
                    <img src={logo} alt='Logo Imagem' />
                    <h3>Recuperar Senha</h3>
                </div>

                <form action="" className='form grid' onSubmit={handleSubmit}>
                    {mensagem && <span className='showMessage'>{mensagem}</span>}

                    <Input
                        type='text'
                        placeholder='Email'
                        id='email'
                        name='email'
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        icon={MdEmail}
                    />

                    <button type='submit' className="btn flex"><span>Enviar</span><CiLogin className='icon' /></button>
                </form>
            </div>
        </div>
    </div>
    </>
    )
}

export default ForgotPassword
