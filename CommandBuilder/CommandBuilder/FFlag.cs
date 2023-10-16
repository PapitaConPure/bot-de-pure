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

		private void FParam_Load(object sender, EventArgs e) {
			foreach(CommandParam.ParamType type in Enum.GetValues(typeof(CommandParam.ParamType)))
				this.cmbTipos.Items.Add(type);

			this.cmbTipos.SelectedIndex = 1;
			this.pnlExpresión.Height -= 60 * 2;
		}

		private void RbExpresión_CheckedChanged(object sender, EventArgs e) {
			bool expressive = this.IsExpressive;

			if(expressive)
				this.pnlExpresión.Height += 60 * 2;
			else
				this.pnlExpresión.Height -= 60 * 2;

			this.pnlNombre.Visible
			= this.pnlTipo.Visible
				= expressive;
		}
	}
}
