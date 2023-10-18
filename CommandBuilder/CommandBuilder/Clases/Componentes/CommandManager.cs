using System.Linq;
using System.Collections.Generic;
using System;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using System.Text;

namespace CommandBuilder {
	public class CommandManager: CommandComponent {
		private const string NAME_REGEX = "^[a-záéíóúñ\\-]+$";

		private readonly string name;
		private readonly List<string> aliases;
		private readonly string desc;
		private readonly string brief;
		private readonly List<CommandResponse> responses;

		public CommandManager(string name, List<string> aliases, string longDescription = "", string briefDescription = "")
		: base(10, CommandBuilder.ComponentType.CommandManager) {
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

			this.responses = new List<CommandResponse>();
		}

		public void AgregarRespuesta(CommandResponse response) {
			this.responses.Add(response);
		}

		public bool UsaOpciones { get; set; } = false;

		public override string Imprimir() {
			StringBuilder impr = new StringBuilder($"const command = new CommandManager('{this.name}', flags)\n");
			
			if(this.aliases.Count > 0)
				impr.AppendLine($"\t.setAliases(\n{string.Join(",\n", this.aliases.Select(alias => $"\t\t'{alias}'"))},\n\t)");

			if(this.brief.Length != 0)
				impr.AppendLine($"\t.setBriefDescription('{this.brief}')");

			if(this.brief.Length + this.desc.Length > 0) {
				if(this.brief.Length == 0 && this.desc.Length < 80)
					impr.AppendLine($"\t.setDescription('{this.desc.Replace("\n", "\\n")}')");
				else if(this.desc.Length != 0) {
					string[] líneas = this.desc.Split(new char[] {'\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
					impr.Append($"\t.setLongDescription(");
					foreach(string línea in líneas)
						impr.Append($"\n\t\t'{línea.Trim(new char[] { ' ', '\n', '\r' })}',");
					impr.AppendLine("\n\t)");
				}
			}
				

			if(this.UsaOpciones)
				impr.AppendLine("\t.setOptions(options)");

			impr.Append(
				"\t.setExecution(async (request, args, isSlash) => {\n" +
					"\t\tconsole.log({ request, args, isSlash });\n\n" +
					"\t\tif(!(args.data ?? args).length)\n" +
						"\t\t\treturn request.reply({ content: '⚠️ no se indicaron los datos necesarios', ephemeral: true });\n\n" +
					"\t\tif(request.userId === request.client.user.id)\n" +
						"\t\t\treturn request.reply({ content: '❌ no puedes hacer eso', ephemeral: true });\n\n" +
					"\t\treturn request.reply({\n" +
						"\t\t\tcontent: '✅ comando de ejemplo ejecutado con éxito',\n" +
					"\t\t});\n" +
				"\t})");

			foreach(CommandResponse response in this.responses)
				impr.Append(response.Imprimir());

			impr.AppendLine(";");

			return impr.ToString();
		}
	}

	public class CommandResponse: IImprimible {
		private readonly string nombre;
		private readonly InteractionType type;
		private readonly List<string> args;

		public enum InteractionType {
			Button = 0,
			SelectMenu = 1,
			Modal = 2,
			Interaction = 3,
		}

		/// <summary>
		/// Crea una respuesta de comando del tipo indicado.
		/// Su función de respuesta recibirá el nombre especificado y los argumentos facilitados
		/// </summary>
		/// <param name="nombre">nombre de la función de respuesta</param>
		/// <param name="type">tipo de respuesta</param>
		/// <param name="args"><see cref="List{string}"/> de argumentos para la función de respuesta</param>
		/// <remarks>Recibe al menos un parámetro: "interaction". No comprueba parámetros repetidos</remarks>
		/// <exception cref="ArgumentException"></exception>
		/// <exception cref="ArgumentNullException"></exception>
		public CommandResponse(string nombre, InteractionType type, List<string> args) {
			if(nombre is null)
				throw new ArgumentNullException("No se proporcionó el nombre de una Respuesta de Comando");

			if(nombre.Length == 0 || !(char.IsLetter(nombre[0]) || nombre[0] == '_'))
				throw new ArgumentException($"Se debe especificar un nombre de Respuesta de Comando válido. Recibido: \"{nombre}\"");

			this.nombre = nombre;
			this.type = type;
			this.args = args;
			this.args.Insert(0, "interaction");
			this.args.RemoveAll(arg => arg.Length == 0);
		}

		/// <summary>
		/// Crea una respuesta de comando del tipo indicado.
		/// Su función de respuesta recibirá el nombre especificado y los argumentos facilitados
		/// </summary>
		/// <param name="nombre">nombre de la función de respuesta</param>
		/// <param name="type">tipo de respuesta</param>
		/// <param name="args">argumentos de la función de respuesta</param>
		/// <remarks>Recibe al menos un parámetro: "interaction". No comprueba parámetros repetidos</remarks>
		/// <exception cref="ArgumentException"></exception>
		/// <exception cref="ArgumentNullException"></exception>
		public CommandResponse(string nombre, InteractionType type, params string[] args): this(nombre, type, args.ToList()) {}

		/// <summary>
		/// Crea una respuesta de comando del tipo indicado, con el nombre de función de respuesta especificado
		/// </summary>
		/// <param name="nombre">nombre de la función de respuesta</param>
		/// <param name="type">tipo de respuesta</param>
		/// <remarks>Recibe al menos un parámetro: "interaction"</remarks>
		/// <exception cref="ArgumentException"></exception>
		/// <exception cref="ArgumentNullException"></exception>
		public CommandResponse(string nombre, InteractionType type): this(nombre, type, new List<string>()) {}

		public string Imprimir() {
			string args = string.Join(", ", this.args);
			return $".set{this.type}Response(async function {this.nombre}({args}) {{\n" +
					"\t\t\n" +
				"\t})";
		}
	}
}
