using System;
using System.Text.RegularExpressions;

namespace CommandBuilder {
	public class CommandParam: CommandOption {
		private readonly string name;
		private readonly ParamType type;

		public enum ParamType {
			Number,
			Text,
			User,
			Member,
			Role,
			Guild,
			Channel,
			Message,
			Emote,
			Image,
			File,
			Url,
			Id,
		}

		/// <summary>
		/// Crea un Parámetro de Comando con el nombre, descripción y tipo especificados
		/// </summary>
		/// <param name="name">Nombre del parámetro</param>
		/// <param name="desc">Descripción del funcionamiento de la opción</param>
		/// <param name="type">Tipo del dato del parámetro</param>
		/// <exception cref="FormatException"></exception>
		public CommandParam(string name, string desc, ParamType type): base(desc) {
			name = name.ToLower().Trim();

			if(!Regex.IsMatch(name, "^[a-záéíóúñ][a-záéíóúñ0-9]*$"))
				throw new FormatException("Los parámetros deben tener un nombre que tenga al menos 1 caracter, comience con una letra y siga con letras y/o números");

			this.name = name;
			this.type = type;
		}

		public override string Identifier => this.name;

		public ParamType Type => this.type;

		public override OptionType OptionKind => OptionType.Param;

		public override string Imprimir() {
			return $"\t.addParam('{this.name}', '{this.type.ToString().ToUpper()}', '{this.desc}'){this.PuntoYComaFinal}";
		}
	}
}
