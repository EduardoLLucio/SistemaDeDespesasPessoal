import React from "react";

export default function Input({ type, placeholder, value, onChange, id, name, icon: Icon }) {
    return (
        <div className="inputDiv">


            <label htmlFor={id}>{placeholder}</label>


            <div className="input flex">

                {Icon && <Icon className = "icon"/> }

        
        <input
         type={type}
         id={id}
         name={name}
         placeholder={placeholder}
         value={value}
         onChange={onChange}
        />
        

     </div>
    </div>
    );
}