namespace CommandBuilder {
	class CommandParam: CommandOption {
		private readonly string name;
		private readonly ParamType type;

		public CommandParam(string name, string desc, ParamType type): base(desc) {
			this.name = name.ToLower();
			this.type = type;
		}

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

		public override string Imprimir() {
			return $"\taddParam('{this.name}', '{this.type.ToString().ToUpper()}', '{this.desc}'){this.PuntoYComaFinal}\n";
		}
	}
}
