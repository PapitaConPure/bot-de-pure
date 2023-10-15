namespace CommandBuilder {
	class CommandFlagExpressive: CommandFlag {
		private readonly string name;
		private readonly CommandParam.ParamType type;

		public CommandFlagExpressive(char[] shortIds, string[] longIds, string desc, string name, CommandParam.ParamType type)
		: base(shortIds, longIds, desc) {
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

		public override string Imprimir() {
			return $"\taddFlag('{this.CompiladoShortIds}', [ {this.CompiladoLongIds} ], '{this.desc}', {{ name: '{this.name}', type: '{this.type.ToString().ToUpper()}' }}){this.PuntoYComaFinal}\n";
		}
	}
}
