using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CommandBuilder {
	public class CommandOptionsManager: IImprimible {
		public List<CommandOption> options;

		public CommandOptionsManager() {
			this.options = new List<CommandOption>();
		}

		public enum CommandOptionType {
			Param = 0,
			Flag = 1,
		}

		public void AgregarOpción(CommandOption option) {
			if(this.options.Count > 0)
				this.options.Last().EsOpciónFinal = false;

			this.options.Add(option);
			option.EsOpciónFinal = true;
		}

		public void RemoverOpción(CommandOption option) {
			if(this.options.Count == 0)
				return;

			this.options.Remove(option);
			option.EsOpciónFinal = false;
			this.options.Last().EsOpciónFinal = true;
		}

		public void LimpiarOpciones() {
			this.options.Clear();
		}

		public string Imprimir() {
			string declaración = "const options = new CommandOptionsManager()\n";
			StringBuilder optionsProcesadas = new StringBuilder();

			foreach(CommandOption option in this.options)
				optionsProcesadas.AppendLine(option.Imprimir());

			return declaración + optionsProcesadas;
		}
	}
}
