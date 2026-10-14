/** Campo de formulário com rótulo e mensagem de erro ligada ao campo. */
export function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <div className="field__label">
        <label htmlFor={id}>{label}</label>
        {error ? (
          <span className="field__error" id={`${id}-err`}>
            {error}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
