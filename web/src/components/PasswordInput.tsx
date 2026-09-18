import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`w-full pr-11 ${props.className ?? ""}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
