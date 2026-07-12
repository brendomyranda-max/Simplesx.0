const { exec } = require("child_process");

app.post("/imprimir", (req, res) => {
  const { conteudo } = req.body;

  const texto = conteudo
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");

  exec(
    `printf "${texto}\\n\\n\\n\\x1b\\x77" | lp -d DieboldRAW`,
    (erro) => {
      if (erro) {
        console.error(erro);
        return res.json({ sucesso: false });
      }

      res.json({ sucesso: true });
    }
  );
});