using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace CommandBuilder {
	public partial class FParam: Form {
		private int baseHeight;

		public FParam(bool permiteBorrar) {
			this.InitializeComponent();

			this.baseHeight = this.Height - 60 * 2;

			foreach(CommandParam.ParamType type in Enum.GetValues(typeof(CommandParam.ParamType)))
				this.cmbTipos.Items.Add(type);
			this.cmbTipos.Items.Remove(CommandParam.ParamType.Dynamic);
			this.cmbTipos.SelectedIndex = 1;

			foreach(ParamPoly.Rank type in Enum.GetValues(typeof(ParamPoly.Rank)))
				this.cmbPoly.Items.Add(type);
			this.cmbPoly.SelectedIndex = 0;

			if(permiteBorrar)
				this.btnEliminar.Visible = true;
		}

		/// <summary>
		/// Genera un parámetro a partir de los datos ingresados al formulario
		/// </summary>
		/// <returns>Un <see cref="CommandParam"/> en base a los datos ingresados</returns>
		/// <exception cref="FormatException"></exception>
		public CommandParam GenerarParámetro() {
			string desc = this.tbDesc.InputText;
			string nombre = this.tbNombre.InputText;
			CommandParam.ParamType type = (CommandParam.ParamType)this.cmbTipos.SelectedItem;

			return new CommandParam(nombre, desc, type);
		}

		private void CmbPoly_SelectedIndexChanged(object sender, EventArgs e) {
			if(this.baseHeight == 0)
				return;

			ParamPoly.Rank rank = (ParamPoly.Rank)this.cmbPoly.SelectedItem;
			bool isPoly = rank >= ParamPoly.Rank.Multiple;

			this.Height = this.baseHeight + (isPoly ? 60 : 0);

			this.pnlPolyMax.Visible = rank == ParamPoly.Rank.Multiple;
			this.pnlPolyParams.Visible = rank == ParamPoly.Rank.Complex;
		}
	}
}
