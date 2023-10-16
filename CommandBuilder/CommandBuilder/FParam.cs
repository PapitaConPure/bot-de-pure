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
		public FParam(bool permiteBorrar) {
			this.InitializeComponent();

			if(permiteBorrar)
				this.btnEliminar.Visible = true;
		}

		private void FParam_Load(object sender, EventArgs e) {
			foreach(CommandParam.ParamType type in Enum.GetValues(typeof(CommandParam.ParamType)))
				this.cmbTipos.Items.Add(type);

			this.cmbTipos.SelectedIndex = 1;
		}
	}
}
