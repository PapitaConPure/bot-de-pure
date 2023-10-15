using System;
using System.Collections.Generic;
using System.Text;

namespace CommandBuilder {
	class CommandTagsManager: IImprimible {
		List<CommandTag> flags;

		public CommandTagsManager() {
			this.flags = new List<CommandTag>();
		}

		public enum CommandTag {
			Common = 0,
			Mod,
			Emote,
			Meme,
			Chaos,
			Game,
			Outdated,
			Maintenance,
			Papa,
			Hourai,
			Guide,
		}

		public void AgregarEtiqueta(CommandTag flag) {
			if(!this.flags.Contains(flag))
				this.flags.Add(flag);
		}

		public void RemoverEtiqueta(CommandTag flag) {
			this.flags.Remove(flag);
		}

		public void LimpiarEtiquetas() {
			this.flags.Clear();
		}

		public string Imprimir() {
			if(this.flags.Count == 0)
				throw new InvalidOperationException("Se debe especificar al menos una MetaFlag de comando");

			if(this.flags.Count == 1)
				return $"const flags = new CommandMetaFlagsManager().add('{this.flags[0].ToString().ToUpper()}');\n";

			string declaración = "const flags = new CommandMetaFlagsManager().add(\n";

			StringBuilder flagsProcesadas = new StringBuilder();

			foreach(CommandTag flag in this.flags)
				flagsProcesadas.AppendLine($"\t'{flag.ToString().ToUpper()}',");

			return
				declaración +
					flagsProcesadas +
				");\n";
		}
	}
}
