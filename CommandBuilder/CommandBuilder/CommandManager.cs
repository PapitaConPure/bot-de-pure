using System.Linq;
using System.Collections.Generic;
using System;
using System.Text.RegularExpressions;
using System.Windows.Forms;

namespace CommandBuilder {
	public class CommandManager: IImprimible {
		private const string NAME_REGEX = "^[a-záéíóúñ\\-]+$";

		private readonly string name;
		private readonly List<string> aliases;
		private readonly string desc;
		private readonly string brief;

		public CommandManager(string name, List<string> aliases, string longDescription = "", string briefDescription = "") {
			if(name.Length == 0)
				throw new FormatException("El nombre no puede estar vacío");

			name = name.ToLower().Trim();
			if(!Regex.IsMatch(name, NAME_REGEX))
				throw new FormatException("El nombre del comando solo puede consistir de letras y guiones");

			for(int i = 0; i < aliases.Count; i++) {
				if(aliases[i].Length == 0) {
					aliases.RemoveAt(i);
					continue;
				}

				aliases[i] = aliases[i].ToLower().Trim();
				if(!Regex.IsMatch(aliases[i], NAME_REGEX))
					throw new FormatException("Los alias del comando solo pueden consistir de letras y guiones");
			}

			this.name = name;
			this.aliases = aliases;

			if(this.aliases.Contains(this.name))
				throw new ArgumentException("El nombre del comando debe diferir de sus alias");

			this.desc = longDescription;
			this.brief = briefDescription;
		}

		public bool UsaOpciones { get; set; } = false;

		public string Imprimir() {
			string impr = $"const command = new CommandManager('{this.name}', flags)\n";
			
			if(this.aliases.Count > 0)
				impr += $"\t.setAliases(\n{string.Join(",\n", this.aliases.Select(alias => $"\t\t'{alias}'"))},\n\t)\n";

			if(this.brief.Length != 0)
				impr += $"\t.setBriefDescription('{this.brief}')\n";

			if(this.brief.Length + this.desc.Length > 0) {
				if(this.brief.Length == 0 && this.desc.Length < 80)
					impr += $"\t.setDescription('{this.desc.Replace("\n", "\\n")}')\n";
				else if(this.desc.Length != 0) {
					string[] líneas = this.desc.Split(new char[] {'\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
					impr += $"\t.setLongDescription(";
					foreach(string línea in líneas)
						impr += $"\n\t\t'{línea.Trim(new char[] { ' ', '\n', '\r' })}',";
					impr += "\n\t)\n";
				}
			}
				

			if(this.UsaOpciones)
				impr += "\t.setOptions(options)\n";

			impr += 
				"\t.setExecution(async (request, args, isSlash) => {\n" +
					"\t\tconsole.log({ request, args, isSlash });\n\n" +
					"\t\treturn request.reply({\n" +
						"\t\t\tcontent: '¡Comienza a escribir código en esta función!',\n" +
					"\t\t});\n" +
				"\t});\n\n" +
				"module.exports = command;";

			return impr;
		}
	}
}
