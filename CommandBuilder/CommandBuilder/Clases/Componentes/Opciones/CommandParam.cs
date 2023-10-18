using System;
using System.Text.RegularExpressions;

using System.Collections.Generic;

namespace CommandBuilder {
	public class CommandParam: CommandOption {
		private readonly string name;
		private readonly bool optional;
		private readonly ParamType type;
		private readonly ParamPoly paramPoly;

		public enum ParamType {
			Dynamic = -1,
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
		/// <param name="optional">Tipo del dato del parámetro</param>
		/// <exception cref="FormatException"></exception>
		public CommandParam(string name, string desc, ParamType type, ParamPoly paramPoly, bool optional): base(desc) {
			name = name.ToLower().Trim();
			if(!Regex.IsMatch(name, "^[a-záéíóúñ][a-záéíóúñ0-9]*$"))
				throw new FormatException("Los parámetros deben tener un nombre que tenga al menos 1 caracter, comience con una letra y siga con letras y/o números");

			this.name = name;
			this.type = type;
			this.paramPoly = paramPoly;
			this.optional = optional;
		}

		public CommandParam(string name, string desc, ParamType type, ParamPoly paramPoly): this(name, desc, type, paramPoly, false) {}

		public CommandParam(string name, string desc, ParamType type, bool optional): this(name, desc, type, ParamPoly.Single, optional) {}

		public CommandParam(string name, string desc, ParamType type) : this(name, desc, type, false) {}


		public override string Identifier => this.name;

		public ParamType Type => this.type;

		public ParamPoly Poly => this.paramPoly;

		public override OptionType OptionKind => OptionType.Param;

		public override string Imprimir() {
			string valor = $"\t.addParam('{this.name}', '{this.type.ToString().ToUpper()}', '{this.desc}'";

			List<string> opciones = new List<string>();

			if(!this.paramPoly.IsSimple)
				opciones.Add(this.paramPoly.Imprimir());

			if(this.optional)
				opciones.Add("optional: true");

			if(opciones.Count > 0)
				valor += $", {{ {string.Join(", ", opciones)} }}";

			valor += $")";

			return valor;
		}
	}
}
