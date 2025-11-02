import React, {useState} from "react";


export default function ModalFoto({modalFotoOpen, setModalFotoOpen, fotoPreview, setFotoPreview, fotoFile, setFotoFile, atualizarFotoUrl}) {

    const [zoom, setZoom] = useState(false);

    if (!modalFotoOpen) return null;

    return (

    <div className='modal-overlay' onClick={() => setModalFotoOpen(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Alterar Foto de Perfil</h2>
            <input
            type='file'
            accept="image/*"
            onChange={e => {
                const file = e.target.files[0];
                setFotoFile(file);
                setFotoPreview(URL.createObjectURL(file));

            }}

            />

            {fotoPreview && (
                <img
                    src={fotoPreview} 
                    alt="Preview" 
                    style={{
                        width: zoom ? 300: 80, 
                        borderRadius: '50%',
                        margin: '1rem auto',
                        cursor: 'pointer'

                    }}
                    onClick={()=> setZoom(!zoom)}
                    title="Clique para ampliar"
                />
            )}

            {zoom && (
                <button className="btn" onClick={() => setZoom(false)}>Fechar</button>
            )}




            <button className="btn" onClick={async () => {if (!fotoFile) return;
            const formData = new FormData();
            formData.append('foto', fotoFile);
        
            const token = localStorage.getItem('token');
            await fetch(`${process.env.REACT_APP_API_URL}/upload-foto`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            setModalFotoOpen(false);
            setFotoPreview(null);
            if (typeof atualizarFotoUrl === 'function') {
                atualizarFotoUrl();
            }
            }}
            >Salvar Foto</button>
        </div>
    </div>
    );
}






