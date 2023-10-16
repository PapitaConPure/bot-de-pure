namespace CommandBuilder {
	public class ParamPoly: IImprimible {
		private readonly Rank rank;
		private readonly int max;
		private readonly string[] polyParams;

		public enum Rank {
			Single = 0,
			Multiple,
			Complex,
		}

		private ParamPoly(Rank rank, int max) {
			this.rank = rank;
			this.max = max;
		}

		private ParamPoly(params string[] polyParams) {
			this.polyParams = polyParams;
			this.max = polyParams.Length;
		}

		public static ParamPoly Single => new ParamPoly(Rank.Single, 1);

		public static ParamPoly Multiple(int polyMax = 8) {
			return new ParamPoly(Rank.Single, polyMax);
		}

		public static ParamPoly Complex(params string[] polyParams) {
			return new ParamPoly(polyParams);
		}

		public bool IsSimple => this.rank == Rank.Single;

		public string Imprimir() {
			if(this.rank != Rank.Complex)
				return $"poly: '{this.rank.ToString().ToUpper()}', polyMax: {this.max}";

			return $"poly: [ '{string.Join("', '", this.polyParams)}' ], polyMax: {this.max}";
		}
	}
}