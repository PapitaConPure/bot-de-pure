using System;
using System.Collections.Generic;
using System.Text;

namespace CommandBuilder {
	public class CommandTagsManager: CommandComponent {
		private readonly List<CommandTag> flags;

		public CommandTagsManager(): base(9, "CommandTags", CommandBuilder.ComponentType.CommandTagsManager) {
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
			Music,
			Hourai,
			Guide,
		}

		public void AgregarEtiqueta(CommandTag flag) {
			if(!this.flags.Contains(flag))
				this.flags.Add(flag);
		}

		/// <summary>
		/// Genera código para instanciar este CommandTags en JavaScript, con las MetaFlags indicadas
		/// </summary>
		/// <returns>El código JavaScript requerido para instanciar el CommandTags representado por la instancia</returns>
		/// <exception cref="InvalidOperationException"></exception>
		public override string Imprimir() {
			if(this.flags.Count == 0)
				throw new InvalidOperationException("Se debe especificar al menos una MetaFlag de comando");

			if(this.flags.Count == 1)
				return $"const flags = new CommandTags().add('{this.flags[0].ToString().ToUpper()}');";

			StringBuilder flagsProcesadas = new StringBuilder();

			foreach(CommandTag flag in this.flags)
				flagsProcesadas.AppendLine($"\t'{flag.ToString().ToUpper()}',");

			return $"const flags = new CommandTags().add(\n{flagsProcesadas});";
		}
	}
}
