using System;
using System.Text.RegularExpressions;

namespace CommandBuilder {
	public class CommandFlagExpressive: CommandFlag {
		private readonly string name;
		private readonly CommandParam.ParamType type;

		/// <summary>
		/// Crea una Bandera de Comando Expresiva con los identificadores indicados, la descripción dada y la expresión detallada.
		/// La expresión consta de un nombre y un tipo, y da capacidades paramétricas a la bandera
		/// </summary>
		/// <param name="shortIds">Identificadores cortos de la bandera</param>
		/// <param name="longIds">Identificadores largos de la bandera</param>
		/// <param name="desc">Descripción del funcionamiento de la opción</param>
		/// <param name="name">Nombre de la expresión de la bandera</param>
		/// <param name="type">Tipo de la expresión de la bandera</param>
		/// <exception cref="FormatException"></exception>
		public CommandFlagExpressive(char[] shortIds, string[] longIds, string desc, string name, CommandParam.ParamType type)
		: base(shortIds, longIds, desc) {
			name = name.ToLower().Trim();

			if(!Regex.IsMatch(name, "^[a-záéíóúñ][a-záéíóúñ0-9]*$"))
				throw new FormatException("Los parámetros deben tener un nombre que tenga al menos 1 caracter, comience con una letra y siga con letras y/o números");

			this.name = name;
			this.type = type;
		}

		public CommandFlagExpressive(char[] shortIds, string desc, string name, CommandParam.ParamType type): base(shortIds, desc) {
			this.name = name;
			this.type = type;
		}

		public CommandFlagExpressive(string[] longIds, string desc, string name, CommandParam.ParamType type): base(longIds, desc) {
			this.name = name;
			this.type = type;
		}

		public CommandFlagExpressive(char shortId, string desc, string name, CommandParam.ParamType type): base(shortId, desc) {
			this.name = name;
			this.type = type;
		}

		public CommandFlagExpressive(string longId, string desc, string name, CommandParam.ParamType type): base(longId, desc) {
			this.name = name;
			this.type = type;
		}

		public string ExprName => this.name;

		public CommandParam.ParamType ExprType => this.type;

		public override string Imprimir() {
			return $"\t.addFlag('{this.CompiladoShortIds}', [ {this.CompiladoLongIds} ], '{this.desc}', {{ name: '{this.name}', type: '{this.type.ToString().ToUpper()}' }})";
		}
	}
}
