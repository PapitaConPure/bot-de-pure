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

			foreach(CommandParam.ParamType type in Enum.GetValues(typeof(CommandParam.ParamType)))
				this.cmbTipos.Items.Add(type);

			this.cmbTipos.SelectedIndex = 1;

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
	}
}
