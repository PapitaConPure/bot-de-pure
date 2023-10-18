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

		public ResponseField(FPrincipal form, CommandResponse.InteractionType type) {
			this.InitializeComponent();
			this.btnRemoveResponse.Click += this.BtnRemoveResponse;
			this.fPrincipal = form;
			this.Type = type;
			this.lblTítulo.Text = type.ToString();
		}

		public CommandResponse.InteractionType Type { get; private set; }

		private void BtnRemoveResponse(object sender, EventArgs e) {
			this.fPrincipal.RemoverRespuesta(this);
		}
	}
}
