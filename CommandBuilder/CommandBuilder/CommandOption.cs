using System;

namespace CommandBuilder {
	abstract class CommandOption: IImprimible {
		protected readonly string desc;

		public enum OptionType {
			Param,
			Flag,
		}

		public CommandOption(string desc) {
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

		public abstract OptionType Type { get; }

		public abstract string Identifier { get; }

		public string Desc => this.desc;

		public abstract string Imprimir();
	}
}
