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
	public partial class FFlag: Form {
		public FFlag(bool permiteBorrar) {
			this.InitializeComponent();

			if(permiteBorrar)
				this.btnEliminar.Visible = true;
		}

		public bool IsExpressive => this.rbExpresiva.Checked;

		/// <summary>
		/// Genera una bandera a partir de los datos ingresados al formulario
		/// </summary>
		/// <returns>Un <see cref="CommandFlag"/> en base a los datos ingresados</returns>
		/// <exception cref="FormatException"></exception>
		public CommandFlag GenerarOpción() {
			CommandFlag result;

			char[] shortIds = this.tbCortos.InputText.ToCharArray();
			string[] longIds = this.tbLargos.InputText.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
			string desc = this.tbDesc.InputText;

			if(this.IsExpressive) {
				string nombre = this.tbNombre.InputText;
				CommandParam.ParamType type = (CommandParam.ParamType)this.cmbTipos.SelectedItem;
				result = new CommandFlagExpressive(shortIds, longIds, desc, nombre, type);
			} else
				result = new CommandFlag(shortIds, longIds, desc);

			return result;
		}

		private void FParam_Load(object sender, EventArgs e) {
			foreach(CommandParam.ParamType type in Enum.GetValues(typeof(CommandParam.ParamType)))
				this.cmbTipos.Items.Add(type);

			this.cmbTipos.SelectedIndex = 1;
			this.pnlExpresión.Height -= 60 * 2;
			this.Height -= 60 * 2;
		}

		private void RbExpresión_CheckedChanged(object sender, EventArgs e) {
			bool expressive = this.IsExpressive;

			if(expressive) {
				this.pnlExpresión.Height += 60 * 2;
				this.Height += 60 * 2;
			} else {
				this.pnlExpresión.Height -= 60 * 2;
				this.Height -= 60 * 2;
			}

			this.pnlNombre.Visible
			= this.pnlTipo.Visible
				= expressive;
		}
	}
}
