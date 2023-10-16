using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace CommandBuilder {
	public partial class FParam: Form {
		private readonly int baseHeight;

		public FParam(bool permiteBorrar) {
			this.InitializeComponent();

			this.baseHeight = this.Height - 60 * 2;

			foreach(CommandParam.ParamType type in Enum.GetValues(typeof(CommandParam.ParamType)))
				this.cmbTipos.Items.Add(type);
			this.cmbTipos.Items.Remove(CommandParam.ParamType.Dynamic);
			this.cmbTipos.SelectedIndex = 1;

			foreach(ParamPoly.PolyRank type in Enum.GetValues(typeof(ParamPoly.PolyRank)))
				this.cmbPoly.Items.Add(type);
			this.cmbPoly.SelectedIndex = 0;

			if(permiteBorrar)
				this.btnEliminar.Visible = true;
		}

		private void CmbPoly_SelectedIndexChanged(object sender, EventArgs e) {
			if(this.baseHeight == 0)
				return;

			ParamPoly.PolyRank rank = (ParamPoly.PolyRank)this.cmbPoly.SelectedItem;
			bool isPoly = rank >= ParamPoly.PolyRank.Multiple;

			this.Height = this.baseHeight + (isPoly ? 60 : 0);

			this.pnlPolyMax.Visible = rank == ParamPoly.PolyRank.Multiple;
			this.pnlPolyParams.Visible = rank == ParamPoly.PolyRank.Complex;
		}

		/// <summary>
		/// Genera un parámetro a partir de los datos ingresados al formulario
		/// </summary>
		/// <returns>Un <see cref="CommandParam"/> en base a los datos ingresados</returns>
		/// <exception cref="FormatException"></exception>
		public CommandParam GenerarParámetro() {
			string desc = this.tbDesc.InputText;
			string nombre = this.tbName.InputText;
			CommandParam.ParamType type = (CommandParam.ParamType)this.cmbTipos.SelectedItem;
			bool optional = this.cbOptional.Checked;

			ParamPoly paramPoly;
			ParamPoly.PolyRank rank = (ParamPoly.PolyRank)this.cmbPoly.SelectedItem;

			if(rank == ParamPoly.PolyRank.Multiple) {
				if(this.tbPolyMax.Empty)
					paramPoly = ParamPoly.Multiple();
				else {
					string valor = this.tbPolyMax.InputText.Trim();

					if(!Regex.IsMatch(valor, "^[0-9]+$"))
						throw new FormatException("La cantidad máxima de poliparámetros debe indicarse con un número entero");

					paramPoly = ParamPoly.Multiple(Convert.ToInt32(valor));
				}
			} else if(rank == ParamPoly.PolyRank.Complex) {
				string[] polyParams = this.tbPolyParams.InputText.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
				paramPoly = ParamPoly.Complex(polyParams);
			} else
				paramPoly = ParamPoly.Single;

			return new CommandParam(nombre, desc, type, paramPoly, optional);
		}
	}
}
