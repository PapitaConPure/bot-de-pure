using System;

namespace CommandBuilder {
	public abstract class CommandOption: IImprimible {
		protected readonly string desc;

		public enum OptionType {
			Param,
			Flag,
		}

		/// <summary>
		/// Crea una Opción de Comando con la descripción especificada
		/// </summary>
		/// <param name="desc">Descripción del funcionamiento de la opción</param>
		/// <exception cref="FormatException"></exception>
		public CommandOption(string desc) {
			if(desc.Length == 0)
				throw new FormatException("Todas las opciones deben tener una descripción de al menos 1 caracter");

			if(desc.Contains("\n"))
				throw new FormatException("La descripción de una opción no puede escribirse en múltiples líneas");

			this.desc = desc;
		}

		public bool EsOpciónFinal { get; set; }

		public string PuntoYComaFinal {
			get {
				if(this.EsOpciónFinal)
					return ";";
				else
					return "";
			}
		}

		public string Desc => this.desc;

		public abstract OptionType OptionKind { get; }

		public abstract string Identifier { get; }

		public abstract string Imprimir();
	}
}
