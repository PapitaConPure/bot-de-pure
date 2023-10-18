using System;

namespace CommandBuilder {
	public abstract class CommandComponent: IImprimible, IComparable {
		private readonly int orden;
		private readonly string requiere;
		private readonly CommandBuilder.ComponentType tipo;

		public CommandComponent(int orden, string requiere, CommandBuilder.ComponentType requerido) {
			this.orden = orden;
			this.requiere = requiere;
			this.tipo = requerido;
		}

		public CommandComponent(int orden, CommandBuilder.ComponentType requerido): this(orden, "", requerido) {
			this.requiere = this.GetType().Name;
		}

		public CommandComponent(int orden, string requiere): this(orden, requiere, CommandBuilder.ComponentType.None) {}

		public CommandComponent(int orden): this(orden, CommandBuilder.ComponentType.None) { }

		public CommandBuilder.ComponentType Tipo => this.tipo;

		public string Requiere => this.requiere;

		public abstract string Imprimir();

		public int CompareTo(object obj) => this.orden.CompareTo((obj as CommandComponent).orden);
	}
}
