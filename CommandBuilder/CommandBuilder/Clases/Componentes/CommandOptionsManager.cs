using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CommandBuilder {
	public class CommandOptionsManager: CommandComponent {
		public List<CommandOption> options;

		public CommandOptionsManager(): base(8, CommandBuilder.ComponentType.CommandOptionsManager) {
			this.options = new List<CommandOption>();
		}

		public enum CommandOptionType {
			Param = 0,
			Flag = 1,
		}

		public void AgregarOpción(CommandOption option) {
			this.options.Add(option);
		}

		public void RemoverOpción(CommandOption option) {
			if(this.options.Count == 0)
				return;

			this.options.Remove(option);
		}

		public void LimpiarOpciones() {
			this.options.Clear();
		}

		public override string Imprimir() {
			StringBuilder optionsProcesadas = new StringBuilder();

			foreach(CommandOption option in this.options)
				optionsProcesadas.Append($"\n{option.Imprimir()}");

			return $"const options = new CommandOptionsManager(){optionsProcesadas};";
		}
	}
}
