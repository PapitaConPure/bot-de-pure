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
	public partial class ResponseField: UserControl {
		private readonly FPrincipal fPrincipal;

		public ResponseField(FPrincipal form) {
			this.InitializeComponent();
			this.btnRemoveAlias.Click += this.BtnRemoveAlias_Click;
			this.fPrincipal = form;
		}

		private void BtnRemoveAlias_Click(object sender, EventArgs e) {
			this.fPrincipal.RemoverRespuesta(this);
		}
	}
}
