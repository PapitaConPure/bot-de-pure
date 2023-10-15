using System;

namespace CommandBuilder {
	abstract class CommandOption: IImprimible {
		protected readonly string desc;

		public CommandOption(string desc) {
			if(this.desc.Contains("\n"))
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

		public abstract string Imprimir();
	}
}
