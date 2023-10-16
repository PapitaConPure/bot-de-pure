namespace CommandBuilder {
	public class ParamPoly: IImprimible {
		private const int POLYMAX_DEFAULT = 8;

		private readonly string[] polyParams;

		public enum PolyRank {
			Single = 0,
			Multiple,
			Complex,
		}

		private ParamPoly(PolyRank rank, int max) {
			this.Rank = rank;
			this.Max = max;
		}

		private ParamPoly(params string[] polyParams) {
			this.Rank = PolyRank.Complex;
			this.polyParams = polyParams;
			this.Max = polyParams.Length;
		}

		public static ParamPoly Single => new ParamPoly(PolyRank.Single, 1);

		public static ParamPoly Multiple(int polyMax = POLYMAX_DEFAULT) {
			return new ParamPoly(PolyRank.Multiple, polyMax);
		}

		public static ParamPoly Complex(params string[] polyParams) {
			return new ParamPoly(polyParams);
		}

		public PolyRank Rank { get; private set; }

		public int Max { get; private set; }

		public bool IsSimple => this.Rank == PolyRank.Single;

		public string VerPolyParams(string separador = ", ") {
			if(this.Rank != PolyRank.Complex)
				return "";

			return string.Join(separador, this.polyParams);
		}

		public string Imprimir() {
			if(this.Rank == PolyRank.Complex)
				return $"poly: [ '{string.Join("', '", this.polyParams)}' ]";

			if(this.Max == POLYMAX_DEFAULT)
				return $"poly: '{this.Rank.ToString().ToUpper()}'";

			return $"poly: '{this.Rank.ToString().ToUpper()}', polyMax: {this.Max}";
		}
	}
}