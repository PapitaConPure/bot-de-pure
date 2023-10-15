using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using ControLib;

namespace CommandBuilder {
	public partial class AliasField: UserControl {
		private FPrincipal fPrincipal;

		public AliasField(FPrincipal form, int id) {
			this.InitializeComponent();
			this.Id = id;
			this.btnRemoveAlias.Click += this.BtnRemoveAlias_Click;
			this.fPrincipal = form;
		}

		public int Id { get; set; }

		private void BtnRemoveAlias_Click(object sender, EventArgs e) {
			SleekButton botón = sender as SleekButton;
			this.fPrincipal.RemoverAlias(this.Id);
		}
	}
}
