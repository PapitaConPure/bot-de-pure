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
	public partial class FPrincipal: Form {
		public FPrincipal() {
			this.InitializeComponent();
		}

		private void FPrincipal_KeyPress(object sender, KeyPressEventArgs e) {
			if(!this.tbNuevoAlias.Focused)
				return;

			MessageBox.Show(this.tbNuevoAlias.InputText);
			this.tbNuevoAlias.Clear();
		}
	}
}
