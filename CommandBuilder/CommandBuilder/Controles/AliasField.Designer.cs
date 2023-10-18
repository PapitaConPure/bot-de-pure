
namespace CommandBuilder {
	partial class AliasField {
		/// <summary> 
		/// Variable del diseñador necesaria.
		/// </summary>
		private System.ComponentModel.IContainer components = null;

		/// <summary> 
		/// Limpiar los recursos que se estén usando.
		/// </summary>
		/// <param name="disposing">true si los recursos administrados se deben desechar; false en caso contrario.</param>
		protected override void Dispose(bool disposing) {
			if(disposing && (components != null)) {
				components.Dispose();
			}
			base.Dispose(disposing);
		}

		#region Código generado por el Diseñador de componentes

		/// <summary> 
		/// Método necesario para admitir el Diseñador. No se puede modificar
		/// el contenido de este método con el editor de código.
		/// </summary>
		private void InitializeComponent() {
			this.pnlAliasField = new System.Windows.Forms.Panel();
			this.tbAlias = new ControLib.SleekTextBox();
			this.btnRemoveAlias = new ControLib.SleekButton();
			this.pnlAliasField.SuspendLayout();
			this.SuspendLayout();
			// 
			// pnlAliasField
			// 
			this.pnlAliasField.Controls.Add(this.tbAlias);
			this.pnlAliasField.Controls.Add(this.btnRemoveAlias);
			this.pnlAliasField.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlAliasField.Location = new System.Drawing.Point(0, 0);
			this.pnlAliasField.Name = "pnlAliasField";
			this.pnlAliasField.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlAliasField.Size = new System.Drawing.Size(150, 45);
			this.pnlAliasField.TabIndex = 4;
			// 
			// tbAlias
			// 
			this.tbAlias.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbAlias.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbAlias.BorderRadius = 100F;
			this.tbAlias.BorderSize = 0F;
			this.tbAlias.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbAlias.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbAlias.FocusColor = System.Drawing.Color.Empty;
			this.tbAlias.Font = new System.Drawing.Font("Microsoft Sans Serif", 11F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.tbAlias.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbAlias.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbAlias.InputText = "";
			this.tbAlias.Location = new System.Drawing.Point(0, 0);
			this.tbAlias.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbAlias.Multiline = false;
			this.tbAlias.Name = "tbAlias";
			this.tbAlias.PasswordChar = '\0';
			this.tbAlias.PercentualRadius = true;
			this.tbAlias.PlaceHolder = "Alias";
			this.tbAlias.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbAlias.ReadOnly = false;
			this.tbAlias.SelectAllOnClick = true;
			this.tbAlias.Size = new System.Drawing.Size(111, 39);
			this.tbAlias.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbAlias.TabIndex = 0;
			this.tbAlias.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbAlias.WordWrap = true;
			// 
			// btnRemoveAlias
			// 
			this.btnRemoveAlias.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.btnRemoveAlias.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnRemoveAlias.BorderRadius = 100F;
			this.btnRemoveAlias.BorderSize = 0F;
			this.btnRemoveAlias.Dock = System.Windows.Forms.DockStyle.Right;
			this.btnRemoveAlias.FlatAppearance.BorderSize = 0;
			this.btnRemoveAlias.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnRemoveAlias.Font = new System.Drawing.Font("Arial Black", 8F, System.Drawing.FontStyle.Bold);
			this.btnRemoveAlias.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(196)))), ((int)(((byte)(130)))));
			this.btnRemoveAlias.Image = global::CommandBuilder.Properties.Resources.x;
			this.btnRemoveAlias.Location = new System.Drawing.Point(111, 0);
			this.btnRemoveAlias.Name = "btnRemoveAlias";
			this.btnRemoveAlias.PercentualRadius = true;
			this.btnRemoveAlias.Size = new System.Drawing.Size(39, 39);
			this.btnRemoveAlias.TabIndex = 2;
			this.btnRemoveAlias.Text = "✖";
			this.btnRemoveAlias.UseVisualStyleBackColor = false;
			// 
			// AliasField
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(18)))), ((int)(((byte)(18)))), ((int)(((byte)(18)))));
			this.Controls.Add(this.pnlAliasField);
			this.Name = "AliasField";
			this.Size = new System.Drawing.Size(150, 45);
			this.pnlAliasField.ResumeLayout(false);
			this.ResumeLayout(false);

		}

		#endregion
		public System.Windows.Forms.Panel pnlAliasField;
		public ControLib.SleekTextBox tbAlias;
		public ControLib.SleekButton btnRemoveAlias;
	}
}
