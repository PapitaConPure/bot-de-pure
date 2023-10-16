using System;
using System.Text;
using System.Text.RegularExpressions;

namespace CommandBuilder {
	class CommandFlag: CommandOption {
		private readonly char[] shortIds;
		private readonly string[] longIds;

		public CommandFlag(char[] shortIds, string[] longIds, string desc): base(desc) {
			foreach(char shortId in shortIds)
				if(!char.IsLetter(shortId))
					throw new FormatException($"Las etiquetas cortas deben ser letras. Se recibió: '{shortId}'");

			foreach(string longId in longIds)
				if(!Regex.IsMatch(longId, "$[A-Za-zÁÉÍÓÚÑáéíóúñ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9]+^"))
					throw new FormatException($"Las etiquetas largas comenzar con una letra y seguir con al menos una letra o número. Se recibió: \"{longId}\"");

			this.shortIds = shortIds;
			this.longIds = longIds;
		}

		public CommandFlag(char[] shortIds, string desc): this(shortIds, new string[0], desc) {}

		public CommandFlag(string[] longIds, string desc): this(new char[0], longIds, desc) {}

		public CommandFlag(char shortId, string desc): this(new char[] { shortId }, new string[0], desc) {}

		public CommandFlag(string longId, string desc): this(new char[0], new string[] { longId }, desc) {}

		protected string CompiladoShortIds {
			get {
				StringBuilder compiladoShortIds = new StringBuilder();

				foreach(char shortId in this.shortIds)
					compiladoShortIds.Append(char.ToLower(shortId));

				return compiladoShortIds.ToString();
			}
		}

		protected string CompiladoLongIds {
			get {
				StringBuilder compiladoLongIds = new StringBuilder();

				foreach(string longId in this.longIds) {
					if(compiladoLongIds.Length > 0)
						compiladoLongIds.Append($", ");

					compiladoLongIds.Append($"'{longId.ToLower()}'");
				}

				return compiladoLongIds.ToString();
			}
		}

		public override OptionType Type => OptionType.Flag;

		public override string Identifier {
			get {
				if(this.longIds.Length > 0)
					return this.longIds[0];

				return this.shortIds[0].ToString();
			}
		}

		public char[] ShortIds { get; internal set; }
		public string[] LongIds { get; internal set; }

		public override string Imprimir() {

			return $"\taddFlag('{this.CompiladoShortIds}', [ {this.CompiladoLongIds} ], '{this.desc}'){this.PuntoYComaFinal}\n";
		}
	}
}
