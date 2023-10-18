using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace CommandBuilder {
	public class CommandFlag: CommandOption {
		private readonly char[] shortIds;
		private readonly string[] longIds;

		/// <summary>
		/// Crea una Bandera de Comando con los identificadores indicados y la descripción facilitada
		/// </summary>
		/// <param name="shortIds">Identificadores cortos de la bandera</param>
		/// <param name="longIds">Identificadores largos de la bandera</param>
		/// <param name="desc">Descripción del funcionamiento de la opción</param>
		/// <exception cref="ArgumentException"></exception>
		/// <exception cref="FormatException"></exception>
		public CommandFlag(char[] shortIds, string[] longIds, string desc): base(desc) {
			List<char> shortR = new List<char>();
			foreach(char shortId in shortIds) {
				if(shortR.Exists(r => r.CompareTo(shortId) == 0))
					continue;

				if(!char.IsLetter(shortId))
					throw new FormatException($"Las etiquetas cortas deben ser letras. Se recibió: '{shortId}'");

				shortR.Add(shortId);
			}

			List<string> longR = new List<string>();
			foreach(string longId in longIds) {
				if(longR.Exists(r => r.CompareTo(longId) == 0))
					continue;

				if(!Regex.IsMatch(longId, "^[A-Za-zÁÉÍÓÚÑáéíóúñ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9]+$"))
					throw new FormatException($"Las etiquetas largas deben comenzar con una letra y seguir con al menos una letra o número. Se recibió: \"{longId}\"");

				longR.Add(longId);
			}

			if(shortR.Count + longR.Count == 0)
				throw new ArgumentException("Se debe ingresar al menos un identificador de bandera, ya sea corto o largo");

			this.shortIds = shortR.ToArray();
			this.longIds = longR.ToArray();
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

		public override OptionType OptionKind => OptionType.Flag;

		public override string Identifier {
			get {
				if(this.longIds.Length > 0)
					return this.longIds[0];

				return this.shortIds[0].ToString();
			}
		}

		public char[] ShortIds => this.shortIds;
		public string[] LongIds => this.longIds;

		public override string Imprimir() {

			return $"\t.addFlag('{this.CompiladoShortIds}', [ {this.CompiladoLongIds} ], '{this.desc}')";
		}
	}
}
