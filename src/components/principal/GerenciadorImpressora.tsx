import React, { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Printer,
  Settings,
  TestTube,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  GerenciadorImpressao,
  ConfiguracaoImpressao,
  ImpressoraDisponivel,
  escanearImpressoras,
  carregarConfiguracaoImpressao,
  salvarConfiguracaoImpressao,
  CONFIG_IMPRESSAO_PADRAO,
} from "@/utils/impressao";
import { useToast } from "@/hooks/use-toast";

const GerenciadorImpressora = () => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ConfiguracaoImpressao>({
    ...CONFIG_IMPRESSAO_PADRAO,
  });
  const [impressoras, setImpressoras] = useState<ImpressoraDisponivel[]>([]);
  const [padraoSistema, setPadraoSistema] = useState<string | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [testando, setTestando] = useState(false);
  const { toast } = useToast();

  const escanear = useCallback(
    async (configAtual: ConfiguracaoImpressao, silencioso = false) => {
      setEscaneando(true);
      try {
        const resultado = await escanearImpressoras(configAtual.servidorUrl);

        if (resultado.erro) {
          setImpressoras([]);
          setPadraoSistema(null);
          if (!silencioso) {
            toast({
              title: "Não foi possível escanear",
              description: resultado.erro,
              variant: "destructive",
            });
          }
          return;
        }

        setImpressoras(resultado.impressoras);
        setPadraoSistema(resultado.padrao);

        setConfig((prev) => {
          // Mantém impressora salva se ainda existir
          if (
            prev.impressora &&
            resultado.impressoras.some((p) => p.nome === prev.impressora)
          ) {
            return prev;
          }
          // Sugere padrão do sistema se nada estiver escolhido
          if (!prev.impressora && resultado.padrao) {
            return { ...prev, impressora: resultado.padrao };
          }
          // Impressora salva sumiu: limpa seleção
          if (
            prev.impressora &&
            !resultado.impressoras.some((p) => p.nome === prev.impressora)
          ) {
            return { ...prev, impressora: "" };
          }
          return prev;
        });

        if (!silencioso) {
          if (resultado.impressoras.length === 0) {
            toast({
              title: "Nenhuma impressora encontrada",
              description: "Conecte uma impressora e escaneie novamente",
            });
          } else {
            toast({
              title: `${resultado.impressoras.length} impressora(s) encontrada(s)`,
              description: resultado.padrao
                ? `Padrão do sistema: ${resultado.padrao}`
                : "Selecione qual deseja usar",
            });
          }
        }
      } finally {
        setEscaneando(false);
      }
    },
    [toast]
  );

  React.useEffect(() => {
    setConfig(carregarConfiguracaoImpressao());
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const salva = carregarConfiguracaoImpressao();
    setConfig(salva);
    void escanear(salva, true);
  }, [open, escanear]);

  const testarImpressao = async () => {
    if (!config.impressora) {
      toast({
        title: "Selecione uma impressora",
        description: "Escaneie e escolha a impressora antes de testar",
        variant: "destructive",
      });
      return;
    }

    setTestando(true);
    const conteudoTeste = `=================================
         TESTE DE IMPRESSÃO
=================================
Data/Hora: ${new Date().toLocaleString("pt-BR")}
Impressora: ${config.impressora}
Largura: ${config.largura}
Fonte: ${config.tamanhoFonte}
---------------------------------
Se você consegue ler isto,
sua impressora está funcionando.
=================================`;

    try {
      // Salva temporariamente para o teste usar os valores da tela
      salvarConfiguracaoImpressao(config);
      const sucesso = await GerenciadorImpressao.obterInstancia().imprimir(
        conteudoTeste,
        "Teste de Impressão",
        config
      );
      toast({
        title: sucesso ? "Teste enviado" : "Erro no teste",
        description: sucesso
          ? `Enviado para: ${config.impressora}`
          : "Falha ao enviar teste. Verifique o servidor e a impressora.",
        variant: sucesso ? "default" : "destructive",
      });
    } catch {
      toast({ title: "Erro no teste", variant: "destructive" });
    } finally {
      setTestando(false);
    }
  };

  const salvarConfiguracoes = () => {
    if (!config.impressora) {
      toast({
        title: "Selecione uma impressora",
        description: "É necessário escolher a impressora antes de salvar",
        variant: "destructive",
      });
      return;
    }

    const salva = salvarConfiguracaoImpressao(config);
    setConfig(salva);
    toast({
      title: "Configurações salvas",
      description: `Impressora: ${salva.impressora}`,
    });
    setOpen(false);
  };

  const labelStatus = (status: string) => {
    if (status === "pronta") return "pronta";
    if (status === "desabilitada") return "desabilitada";
    if (status === "imprimindo") return "imprimindo";
    return status || "disponível";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Impressora
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            Gerenciar Impressora
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Impressora do computador</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void escanear(config, false)}
                disabled={escaneando}
                className="gap-1"
              >
                {escaneando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {escaneando ? "Escaneando..." : "Escanear"}
              </Button>
            </div>

            <Select
              value={config.impressora || undefined}
              onValueChange={(v) => setConfig({ ...config, impressora: v })}
              disabled={impressoras.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    escaneando
                      ? "Escaneando impressoras..."
                      : impressoras.length === 0
                        ? "Nenhuma impressora — clique em Escanear"
                        : "Selecione a impressora"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {impressoras.map((imp) => (
                  <SelectItem key={imp.nome} value={imp.nome}>
                    {imp.nome}
                    {padraoSistema === imp.nome ? " (padrão do sistema)" : ""}
                    {" — "}
                    {labelStatus(imp.status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {config.impressora ? (
              <p className="text-xs text-muted-foreground">
                Impressões do app usarão: <strong>{config.impressora}</strong>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Escaneie, escolha a impressora e clique em Salvar.
              </p>
            )}
          </div>

          <div>
            <Label>Largura do papel</Label>
            <Select
              value={config.largura}
              onValueChange={(v) => setConfig({ ...config, largura: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58mm">58mm (pequena)</SelectItem>
                <SelectItem value="80mm">80mm (padrão)</SelectItem>
                <SelectItem value="112mm">112mm (grande)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tamanho da fonte</Label>
            <Select
              value={config.tamanhoFonte}
              onValueChange={(v) => setConfig({ ...config, tamanhoFonte: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8px">8px (pequena)</SelectItem>
                <SelectItem value="9px">9px (padrão)</SelectItem>
                <SelectItem value="10px">10px (média)</SelectItem>
                <SelectItem value="11px">11px (grande)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Margens</Label>
            <Select
              value={config.margens}
              onValueChange={(v) => setConfig({ ...config, margens: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0mm">0mm</SelectItem>
                <SelectItem value="1mm">1mm</SelectItem>
                <SelectItem value="2mm">2mm</SelectItem>
                <SelectItem value="3mm">3mm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-accent/50 p-3 text-xs text-accent-foreground">
            Configure aqui a impressora. Comandas, cozinha e contas usam esta
            escolha automaticamente.
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => void testarImpressao()}
              disabled={testando || !config.impressora}
              variant="outline"
              className="flex-1"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testando ? "Testando..." : "Testar"}
            </Button>
            <Button
              onClick={salvarConfiguracoes}
              className="flex-1"
              disabled={!config.impressora}
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GerenciadorImpressora;
